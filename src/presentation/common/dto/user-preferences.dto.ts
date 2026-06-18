import { IsArray, IsIn, IsOptional, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

import { accessibilityFeatureValues } from "@/domain/common/accessibility-feature";
import type { AccessibilityFeature } from "@/domain/common/accessibility-feature";

export class UserPreferencesDto {
  @IsArray()
  @IsIn(accessibilityFeatureValues, { each: true })
  accessibilityFeatures!: AccessibilityFeature[];
}

export class OptionalUserPreferencesDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UserPreferencesDto)
  preferences?: UserPreferencesDto;
}
