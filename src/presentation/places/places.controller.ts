import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";

import { PlacesService } from "@/application/places/places.service";
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard
} from "@/presentation/auth/guards/jwt-auth.guard";
import { CurrentUser } from "@/presentation/common/current-user.decorator";
import type { AuthUser } from "@/domain/users/user.entity";
import type { MaybeAuthenticatedRequest } from "@/presentation/common/authenticated-request";
import { Req } from "@nestjs/common";
import { CreatePlaceDto, PlaceListQueryDto } from "@/presentation/places/dto/place.dto";

@Controller("places")
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async list(
    @Query() query: PlaceListQueryDto,
    @Req() request: MaybeAuthenticatedRequest
  ) {
    return this.placesService.list(query, request.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() body: CreatePlaceDto) {
    const place = await this.placesService.createSubmission({
      ...body,
      submittedBy: user.id
    });

    return {
      place
    };
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(":placeId")
  async findById(
    @Param("placeId") placeId: string,
    @Req() request: MaybeAuthenticatedRequest
  ) {
    return {
      place: await this.placesService.findById(placeId, request.user?.id)
    };
  }
}
