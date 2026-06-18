import { IsArray, IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

import {
  accessibilityFeatureValues,
  type AccessibilityFeature
} from "@/domain/common/accessibility-feature";

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  text!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images: string[] = [];

  @IsOptional()
  @IsArray()
  @IsIn(accessibilityFeatureValues, { each: true })
  accessibilityFeedback: AccessibilityFeature[] = [];
}
