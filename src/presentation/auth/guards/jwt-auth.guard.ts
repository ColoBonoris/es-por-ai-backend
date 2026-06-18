import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import type { Request } from "express";

import { AuthService } from "@/application/auth/auth.service";
import { ACCESS_TOKEN_COOKIE } from "@/presentation/auth/auth-cookie.util";
import type {
  AuthenticatedRequest,
  MaybeAuthenticatedRequest
} from "@/presentation/common/authenticated-request";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = await this.authService.getUserFromAccessToken(getAccessToken(request));

    if (!user) {
      throw new UnauthorizedException("Necesitás iniciar sesión.");
    }

    request.user = user;
    return true;
  }
}

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest<MaybeAuthenticatedRequest>();
    const user = await this.authService.getUserFromAccessToken(getAccessToken(request));

    if (user) {
      request.user = user;
    }

    return true;
  }
}

function getAccessToken(request: Request) {
  const cookieToken = request.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined;

  if (cookieToken) {
    return cookieToken;
  }

  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return undefined;
  }

  return authorization.slice("Bearer ".length);
}
