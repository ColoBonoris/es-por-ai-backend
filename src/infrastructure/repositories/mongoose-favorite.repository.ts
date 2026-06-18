import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";

import {
  createPaginationMeta,
  normalizePagination,
  type PaginationQuery
} from "@/domain/common/pagination";
import type { FavoriteRepository } from "@/domain/favorites/favorite.repository";
import type { Place } from "@/domain/places/place.entity";
import {
  FavoriteModel
} from "@/infrastructure/database/schemas/favorite.schema";
import {
  PlaceModel
} from "@/infrastructure/database/schemas/place.schema";
import { mapPlace } from "@/infrastructure/repositories/mongoose-place.repository";
import { toObjectId } from "@/infrastructure/repositories/mongoose-utils";

@Injectable()
export class MongooseFavoriteRepository implements FavoriteRepository {
  constructor(
    @InjectModel(FavoriteModel.name)
    private readonly favoriteModel: Model<FavoriteModel>,
    @InjectModel(PlaceModel.name) private readonly placeModel: Model<PlaceModel>
  ) {}

  async listPlaceIds(userId: string): Promise<string[]> {
    const objectId = toObjectId(userId);

    if (!objectId) {
      return [];
    }

    const documents = await this.favoriteModel
      .find({ userId: objectId })
      .sort({ createdAt: -1 })
      .exec();

    return documents.map((document) => document.placeId);
  }

  async listPlaces(userId: string, query: PaginationQuery) {
    const objectId = toObjectId(userId);

    if (!objectId) {
      return {
        data: [] as Place[],
        pagination: createPaginationMeta(1, query.pageSize ?? 20, 0)
      };
    }

    const { page, pageSize, skip } = normalizePagination(query);
    const [favorites, total] = await Promise.all([
      this.favoriteModel
        .find({ userId: objectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.favoriteModel.countDocuments({ userId: objectId }).exec()
    ]);
    const placeIds = favorites.map((favorite) => favorite.placeId);
    const places = await this.placeModel.find({ id: { $in: placeIds } }).exec();
    const byId = new Map(places.map((place) => [place.id, mapPlace(place)]));

    return {
      data: placeIds.flatMap((id) => {
        const place = byId.get(id);
        return place ? [{ ...place, isFavorite: true }] : [];
      }),
      pagination: createPaginationMeta(page, pageSize, total)
    };
  }

  async add(userId: string, placeId: string) {
    const objectId = toObjectId(userId);

    if (!objectId) {
      return;
    }

    await this.favoriteModel
      .updateOne(
        { userId: objectId, placeId },
        { userId: objectId, placeId },
        { upsert: true }
      )
      .exec();
  }

  async remove(userId: string, placeId: string) {
    const objectId = toObjectId(userId);

    if (!objectId) {
      return;
    }

    await this.favoriteModel.deleteOne({ userId: objectId, placeId }).exec();
  }

  async countByUserId(userId: string): Promise<number> {
    const objectId = toObjectId(userId);

    if (!objectId) {
      return 0;
    }

    return this.favoriteModel.countDocuments({ userId: objectId }).exec();
  }
}
