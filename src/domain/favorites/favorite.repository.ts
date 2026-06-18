import type { PaginatedResult, PaginationQuery } from "@/domain/common/pagination";
import type { Place } from "@/domain/places/place.entity";

export interface FavoriteRepository {
  listPlaceIds(userId: string): Promise<string[]>;
  listPlaces(userId: string, query: PaginationQuery): Promise<PaginatedResult<Place>>;
  add(userId: string, placeId: string): Promise<void>;
  remove(userId: string, placeId: string): Promise<void>;
  countByUserId(userId: string): Promise<number>;
}

export const FAVORITE_REPOSITORY = Symbol("FAVORITE_REPOSITORY");
