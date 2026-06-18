import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";

import { FavoritesService } from "@/application/favorites/favorites.service";
import { JwtAuthGuard } from "@/presentation/auth/guards/jwt-auth.guard";
import { CurrentUser } from "@/presentation/common/current-user.decorator";
import { PaginationQueryDto } from "@/presentation/common/dto/pagination-query.dto";
import type { AuthUser } from "@/domain/users/user.entity";

@UseGuards(JwtAuthGuard)
@Controller("favorites")
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
    return this.favoritesService.list(user.id, query);
  }

  @Post(":placeId")
  add(@CurrentUser() user: AuthUser, @Param("placeId") placeId: string) {
    return this.favoritesService.add(user.id, placeId);
  }

  @Delete(":placeId")
  remove(@CurrentUser() user: AuthUser, @Param("placeId") placeId: string) {
    return this.favoritesService.remove(user.id, placeId);
  }
}
