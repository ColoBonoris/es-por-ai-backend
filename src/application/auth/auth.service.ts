import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { randomBytes } from "crypto";
import type { StringValue } from "ms";

import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository
} from "@/domain/auth/refresh-token.repository";
import {
  USER_REPOSITORY,
  type UserRepository
} from "@/domain/users/user.repository";
import {
  createAvatarInitials,
  defaultUserPreferences,
  defaultUserSettings,
  toAuthUser,
  type AuthUser,
  type UserPreferences
} from "@/domain/users/user.entity";
import { UserRole } from "@/domain/users/user-role.enum";
import { PASSWORD_HASHER, type PasswordHasher } from "@/application/auth/password-hasher";
import { hashOpaqueToken } from "@/application/auth/token-hasher";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenMaxAgeMs: number;
  refreshTokenMaxAgeMs: number;
}

export interface AuthResult {
  user: AuthUser;
  tokens: AuthTokens;
}

interface AccessTokenPayload {
  sub: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: RefreshTokenRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async register(input: {
    name: string;
    email: string;
    password: string;
    preferences?: UserPreferences;
  }): Promise<AuthResult> {
    const email = normalizeEmail(input.email);
    const existingUser = await this.users.findByEmail(email);

    if (existingUser) {
      throw new ConflictException("Ya existe una cuenta con ese email.");
    }

    const user = await this.users.create({
      name: input.name.trim(),
      email,
      passwordHash: await this.passwordHasher.hash(input.password),
      role: UserRole.CLIENT,
      preferences: input.preferences ?? defaultUserPreferences,
      settings: defaultUserSettings,
      avatar: createAvatarInitials(input.name)
    });

    return {
      user: toAuthUser(user),
      tokens: await this.issueTokens(user.id, user.role)
    };
  }

  async login(emailInput: string, password: string): Promise<AuthResult> {
    const user = await this.users.findByEmail(normalizeEmail(emailInput));

    if (!user || !(await this.passwordHasher.compare(password, user.passwordHash))) {
      throw new UnauthorizedException("Credenciales inválidas.");
    }

    return {
      user: toAuthUser(user),
      tokens: await this.issueTokens(user.id, user.role)
    };
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    const tokenHash = hashOpaqueToken(refreshToken);
    const storedRefreshToken = await this.refreshTokens.findActiveByHash(
      tokenHash,
      new Date()
    );

    if (!storedRefreshToken) {
      throw new UnauthorizedException("Sesión expirada.");
    }

    const user = await this.users.findById(storedRefreshToken.userId);

    if (!user) {
      throw new UnauthorizedException("Sesión expirada.");
    }

    await this.refreshTokens.revokeByHash(tokenHash, new Date());

    return {
      user: toAuthUser(user),
      tokens: await this.issueTokens(user.id, user.role)
    };
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return;
    }

    await this.refreshTokens.revokeByHash(hashOpaqueToken(refreshToken), new Date());
  }

  async getUserFromAccessToken(accessToken?: string): Promise<AuthUser | null> {
    if (!accessToken) {
      return null;
    }

    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
        accessToken,
        {
          secret: this.getAccessSecret()
        }
      );
      const user = await this.users.findById(payload.sub);
      return user ? toAuthUser(user) : null;
    } catch {
      return null;
    }
  }

  private async issueTokens(userId: string, role: UserRole): Promise<AuthTokens> {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, role } satisfies AccessTokenPayload,
      {
        secret: this.getAccessSecret(),
        expiresIn: this.getAccessTokenTtl()
      }
    );
    const refreshToken = randomBytes(64).toString("base64url");
    const refreshTokenMaxAgeMs = this.getRefreshTokenMaxAgeMs();

    await this.refreshTokens.create({
      userId,
      tokenHash: hashOpaqueToken(refreshToken),
      expiresAt: new Date(Date.now() + refreshTokenMaxAgeMs)
    });

    return {
      accessToken,
      refreshToken,
      accessTokenMaxAgeMs: 15 * 60 * 1000,
      refreshTokenMaxAgeMs
    };
  }

  private getAccessSecret() {
    return (
      this.configService.get<string>("JWT_ACCESS_SECRET") ??
      "development-access-secret"
    );
  }

  private getAccessTokenTtl(): StringValue {
    return (this.configService.get<string>("ACCESS_TOKEN_TTL") ??
      "15m") as StringValue;
  }

  private getRefreshTokenMaxAgeMs() {
    const days = this.configService.get<number>("REFRESH_TOKEN_TTL_DAYS") ?? 30;
    return days * 24 * 60 * 60 * 1000;
  }
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
