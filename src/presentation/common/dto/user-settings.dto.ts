import { Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsObject,
  ValidateNested
} from "class-validator";

export class NotificationSettingsDto {
  @IsBoolean()
  reviews!: boolean;

  @IsBoolean()
  recommendations!: boolean;
}

export class PermissionPreferenceDto {
  @IsBoolean()
  location!: boolean;

  @IsBoolean()
  camera!: boolean;

  @IsBoolean()
  notifications!: boolean;
}

export class UserSettingsDto {
  @IsIn(["light", "dark", "high-contrast"])
  theme!: "light" | "dark" | "high-contrast";

  @IsObject()
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  notifications!: NotificationSettingsDto;

  @IsObject()
  @ValidateNested()
  @Type(() => PermissionPreferenceDto)
  permissions!: PermissionPreferenceDto;
}
