import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import {
  PLACE_REPOSITORY,
  PLACE_SUBMISSION_REPOSITORY,
  type CreatePlaceSubmissionInput,
  type PlaceListQuery,
  type PlaceRepository,
  type PlaceSubmissionRepository
} from "@/domain/places/place.repository";
import {
  FAVORITE_REPOSITORY,
  type FavoriteRepository
} from "@/domain/favorites/favorite.repository";

@Injectable()
export class PlacesService {
  constructor(
    @Inject(PLACE_REPOSITORY) private readonly places: PlaceRepository,
    @Inject(PLACE_SUBMISSION_REPOSITORY)
    private readonly placeSubmissions: PlaceSubmissionRepository,
    @Inject(FAVORITE_REPOSITORY) private readonly favorites: FavoriteRepository
  ) {}

  async list(query: PlaceListQuery, userId?: string) {
    const result = await this.places.list(query);
    const favoriteIds = userId ? await this.favorites.listPlaceIds(userId) : [];

    return {
      ...result,
      data: result.data.map((place) => ({
        ...place,
        isFavorite: favoriteIds.includes(place.id)
      }))
    };
  }

  async findById(placeId: string, userId?: string) {
    const place = await this.places.findById(placeId);

    if (!place) {
      throw new NotFoundException("Lugar no encontrado.");
    }

    const favoriteIds = userId ? await this.favorites.listPlaceIds(userId) : [];

    return {
      ...place,
      isFavorite: favoriteIds.includes(place.id)
    };
  }

  async createSubmission(input: CreatePlaceSubmissionInput) {
    return this.placeSubmissions.create(input);
  }
}
