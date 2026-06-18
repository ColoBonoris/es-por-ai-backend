import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";
import { Type } from "class-transformer";
import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested
} from "class-validator";

import { AdminPlaceSubmissionsService } from "@/application/admin/admin-place-submissions.service";
import { UserRole } from "@/domain/users/user-role.enum";
import { JwtAuthGuard } from "@/presentation/auth/guards/jwt-auth.guard";
import { Roles, RolesGuard } from "@/presentation/auth/guards/roles.guard";
import { PaginationQueryDto } from "@/presentation/common/dto/pagination-query.dto";

class AdminPlaceSubmissionsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  query?: string;
}

class CoordinatesDto {
  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;
}

class ApprovePlaceSubmissionDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/place-submissions")
export class AdminPlaceSubmissionsController {
  constructor(
    private readonly adminPlaceSubmissionsService: AdminPlaceSubmissionsService
  ) {}

  @Get()
  listPending(@Query() query: AdminPlaceSubmissionsQueryDto) {
    return this.adminPlaceSubmissionsService.listPending(query);
  }

  @Post(":submissionId/approve")
  approve(
    @Param("submissionId") submissionId: string,
    @Body() body: ApprovePlaceSubmissionDto
  ) {
    return this.adminPlaceSubmissionsService.approve(
      submissionId,
      body.coordinates
    );
  }

  @Post(":submissionId/reject")
  reject(@Param("submissionId") submissionId: string) {
    return this.adminPlaceSubmissionsService.reject(submissionId);
  }
}
