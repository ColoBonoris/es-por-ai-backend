import type { Response } from "express";

import type { AuthTokens } from "@/application/auth/auth.service";

export const ACCESS_TOKEN_COOKIE = "esporai_access_token";
export const REFRESH_TOKEN_COOKIE = "esporai_refresh_token";

export function setAuthCookies(response: Response, tokens: AuthTokens) {
  const secure = process.env.NODE_ENV === "production";

  response.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: tokens.accessTokenMaxAgeMs
  });

  response.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: tokens.refreshTokenMaxAgeMs
  });
}

export function clearAuthCookies(response: Response) {
  const secure = process.env.NODE_ENV === "production";
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/"
  };

  response.clearCookie(ACCESS_TOKEN_COOKIE, options);
  response.clearCookie(REFRESH_TOKEN_COOKIE, options);
}
