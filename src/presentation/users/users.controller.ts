import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";

import { UserProfileService } from "@/application/users/user-profile.service";
import { JwtAuthGuard } from "@/presentation/auth/guards/jwt-auth.guard";
import { CurrentUser } from "@/presentation/common/current-user.decorator";
import type { AuthUser } from "@/domain/users/user.entity";
import {
  UpdatePermissionsDto,
  UpdatePreferencesDto,
  UpdateSettingsDto
} from "@/presentation/users/dto/update-user.dto";

@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Get("me")
  async me(@CurrentUser() user: AuthUser) {
    return {
      user: await this.userProfileService.getProfile(user.id)
    };
  }

  @Patch("me/preferences")
  async updatePreferences(
    @CurrentUser() user: AuthUser,
    @Body() body: UpdatePreferencesDto
  ) {
    return {
      user: await this.userProfileService.updatePreferences(user.id, body.preferences)
    };
  }

  @Patch("me/settings")
  async updateSettings(
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateSettingsDto
  ) {
    return {
      user: await this.userProfileService.updateSettings(user.id, body.settings)
    };
  }

  @Patch("me/permissions")
  async updatePermissions(
    @CurrentUser() user: AuthUser,
    @Body() body: UpdatePermissionsDto
  ) {
    return {
      user: await this.userProfileService.updatePermissions(user.id, body.permissions)
    };
  }
}
