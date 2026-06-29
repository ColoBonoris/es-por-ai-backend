import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  ValidateIf
} from "class-validator";

import {
  accessibilityFeatureValues,
  type AccessibilityFeature
} from "@/domain/common/accessibility-feature";

export class PlaceListQueryDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsIn(["recommended"])
  filter?: "recommended";

  @IsOptional()
  @Transform(({ value }: { value: unknown }): string[] | undefined => {
    if (Array.isArray(value)) {
      return value.flatMap((item) => String(item).split(","));
    }

    if (typeof value === "string") {
      return value.split(",");
    }

    return undefined;
  })
  @IsArray()
  @IsIn(accessibilityFeatureValues, { each: true })
  features?: AccessibilityFeature[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;
}

class CoordinatesDto {
  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;
}

export class CreatePlaceDto {
  @IsString()
  name!: string;

  @IsString()
  address!: string;

  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  description = "";

  @IsObject()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates!: CoordinatesDto;

  @IsOptional()
  @IsArray()
  @IsIn(accessibilityFeatureValues, { each: true })
  badges: AccessibilityFeature[] = [];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images: string[] = [];

  @ValidateIf((object: CreatePlaceDto) => object.menuText !== undefined)
  @IsString()
  menuText?: string;
}
