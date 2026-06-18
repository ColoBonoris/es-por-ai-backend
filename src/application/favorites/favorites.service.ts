import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { PaginationQuery } from "@/domain/common/pagination";
import {
  FAVORITE_REPOSITORY,
  type FavoriteRepository
} from "@/domain/favorites/favorite.repository";
import {
  PLACE_REPOSITORY,
  type PlaceRepository
} from "@/domain/places/place.repository";

@Injectable()
export class FavoritesService {
  constructor(
    @Inject(FAVORITE_REPOSITORY) private readonly favorites: FavoriteRepository,
    @Inject(PLACE_REPOSITORY) private readonly places: PlaceRepository
  ) {}

  async list(userId: string, query: PaginationQuery) {
    return this.favorites.listPlaces(userId, query);
  }

  async add(userId: string, placeId: string) {
    await this.ensurePlaceExists(placeId);
    await this.favorites.add(userId, placeId);

    return {
      placeId,
      isFavorite: true
    };
  }

  async remove(userId: string, placeId: string) {
    await this.ensurePlaceExists(placeId);
    await this.favorites.remove(userId, placeId);

    return {
      placeId,
      isFavorite: false
    };
  }

  private async ensurePlaceExists(placeId: string) {
    const place = await this.places.findById(placeId);

    if (!place) {
      throw new NotFoundException("Lugar no encontrado.");
    }
  }
}
