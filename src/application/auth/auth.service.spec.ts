import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { JwtService } from "@nestjs/jwt";

import { AuthService } from "@/application/auth/auth.service";
import { hashOpaqueToken } from "@/application/auth/token-hasher";
import type { PasswordHasher } from "@/application/auth/password-hasher";
import type { RefreshTokenRepository } from "@/domain/auth/refresh-token.repository";
import {
  defaultUserPreferences,
  defaultUserSettings,
  type User
} from "@/domain/users/user.entity";
import type { UserRepository } from "@/domain/users/user.repository";
import { UserRole } from "@/domain/users/user-role.enum";

const baseUser: User = {
  id: "507f1f77bcf86cd799439011",
  name: "María González",
  email: "maria@email.com",
  passwordHash: "hashed-password",
  role: UserRole.CLIENT,
  avatar: "MG",
  preferences: defaultUserPreferences,
  settings: defaultUserSettings
};

describe("AuthService", () => {
  let users: jest.Mocked<UserRepository>;
  let refreshTokens: jest.Mocked<RefreshTokenRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let jwtService: jest.Mocked<Pick<JwtService, "signAsync" | "verifyAsync">>;
  let service: AuthService;

  beforeEach(() => {
    users = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      updatePreferences: jest.fn(),
      updateSettings: jest.fn(),
      listAdminUsers: jest.fn()
    };
    refreshTokens = {
      create: jest.fn(),
      findActiveByHash: jest.fn(),
      revokeByHash: jest.fn(),
      revokeAllForUser: jest.fn()
    };
    passwordHasher = {
      hash: jest.fn(),
      compare: jest.fn()
    };
    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn()
    };
    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string | number> = {
          JWT_ACCESS_SECRET: "test-access-secret",
          ACCESS_TOKEN_TTL: "15m",
          REFRESH_TOKEN_TTL_DAYS: 30
        };
        return values[key];
      })
    } as unknown as ConfigService;

    service = new AuthService(
      users,
      refreshTokens,
      passwordHasher,
      jwtService as unknown as JwtService,
      configService
    );
  });

  it("registers public users as CLIENT and issues tokens", async () => {
    users.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue("hashed-password");
    users.create.mockResolvedValue(baseUser);
    jwtService.signAsync.mockResolvedValue("access-token");
    refreshTokens.create.mockResolvedValue({
      id: "refresh-id",
      userId: baseUser.id,
      tokenHash: "refresh-hash",
      expiresAt: new Date()
    });

    const result = await service.register({
      name: "María González",
      email: " MARIA@EMAIL.COM ",
      password: "Acceso123!"
    });

    expect(users.create.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        email: "maria@email.com",
        role: UserRole.CLIENT,
        avatar: "MG"
      })
    );
    expect(result.user.role).toBe(UserRole.CLIENT);
    expect(result.tokens.accessToken).toBe("access-token");
  });

  it("rejects duplicate registration emails", async () => {
    users.findByEmail.mockResolvedValue(baseUser);

    await expect(
      service.register({
        name: "María González",
        email: "maria@email.com",
        password: "Acceso123!"
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("rejects invalid login credentials", async () => {
    users.findByEmail.mockResolvedValue(baseUser);
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      service.login("maria@email.com", "wrong-password")
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rotates refresh tokens", async () => {
    const refreshToken = "presented-refresh-token";
    refreshTokens.findActiveByHash.mockResolvedValue({
      id: "refresh-id",
      userId: baseUser.id,
      tokenHash: hashOpaqueToken(refreshToken),
      expiresAt: new Date(Date.now() + 60_000)
    });
    users.findById.mockResolvedValue(baseUser);
    jwtService.signAsync.mockResolvedValue("next-access-token");
    refreshTokens.create.mockResolvedValue({
      id: "next-refresh-id",
      userId: baseUser.id,
      tokenHash: "next-refresh-hash",
      expiresAt: new Date()
    });

    const result = await service.refresh(refreshToken);

    expect(refreshTokens.revokeByHash.mock.calls[0]).toEqual([
      hashOpaqueToken(refreshToken),
      expect.any(Date)
    ]);
    expect(refreshTokens.create.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        userId: baseUser.id
      })
    );
    expect(result.tokens.accessToken).toBe("next-access-token");
  });
});
