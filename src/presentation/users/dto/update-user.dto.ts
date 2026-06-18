import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";

import { UserPreferencesDto } from "@/presentation/common/dto/user-preferences.dto";
import {
  PermissionPreferenceDto,
  UserSettingsDto
} from "@/presentation/common/dto/user-settings.dto";

export class UpdatePreferencesDto {
  @ValidateNested()
  @Type(() => UserPreferencesDto)
  preferences!: UserPreferencesDto;
}

export class UpdateSettingsDto {
  @ValidateNested()
  @Type(() => UserSettingsDto)
  settings!: UserSettingsDto;
}

export class UpdatePermissionsDto {
  @ValidateNested()
  @Type(() => PermissionPreferenceDto)
  permissions!: PermissionPreferenceDto;
}
