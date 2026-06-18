import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException
} from "@nestjs/common";
import type { Request, Response } from "express";

import { AuthService } from "@/application/auth/auth.service";
import {
  ACCESS_TOKEN_COOKIE,
  clearAuthCookies,
  REFRESH_TOKEN_COOKIE,
  setAuthCookies
} from "@/presentation/auth/auth-cookie.util";
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto
} from "@/presentation/auth/dto/auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.authService.register(body);
    setAuthCookies(response, result.tokens);

    return {
      user: result.user
    };
  }

  @Post("login")
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.authService.login(body.email, body.password);
    setAuthCookies(response, result.tokens);

    return {
      user: result.user
    };
  }

  @Post("refresh")
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE] as
      | string
      | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException("Sesión expirada.");
    }

    const result = await this.authService.refresh(refreshToken);
    setAuthCookies(response, result.tokens);

    return {
      user: result.user
    };
  }

  @Post("logout")
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ) {
    await this.authService.logout(
      request.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined
    );
    clearAuthCookies(response);

    return {
      ok: true
    };
  }

  @Get("me")
  async me(@Req() request: Request) {
    const user = await this.authService.getUserFromAccessToken(
      request.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined
    );

    return {
      user
    };
  }

  @Post("forgot-password")
  forgotPassword(@Body() body: ForgotPasswordDto) {
    void body;

    return {
      user: null
    };
  }
}
