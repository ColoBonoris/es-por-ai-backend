import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { FilterQuery, Model } from "mongoose";

import {
  createPaginationMeta,
  normalizePagination
} from "@/domain/common/pagination";
import type { Place, PlaceSubmission } from "@/domain/places/place.entity";
import type {
  CreateApprovedPlaceInput,
  CreatePlaceSubmissionInput,
  PlaceListQuery,
  PlaceRecommendationQuery,
  PlaceRecommendationSortCriterion,
  PlaceRepository,
  PlaceSubmissionListQuery,
  PlaceSubmissionRepository
} from "@/domain/places/place.repository";
import {
  PlaceModel,
  type PlaceDocument
} from "@/infrastructure/database/schemas/place.schema";
import {
  PlaceSubmissionModel,
  type PlaceSubmissionDocument
} from "@/infrastructure/database/schemas/place-submission.schema";
import {
  createPublicId,
  escapeRegex,
  toObjectId
} from "@/infrastructure/repositories/mongoose-utils";

@Injectable()
export class MongoosePlaceRepository implements PlaceRepository {
  constructor(
    @InjectModel(PlaceModel.name) private readonly placeModel: Model<PlaceModel>
  ) {}

  async list(query: PlaceListQuery) {
    const { page, pageSize, skip } = normalizePagination(query);
    const filter = buildPlaceFilter(query);

    const [documents, total] = await Promise.all([
      this.placeModel
        .find(filter)
        .sort({ verified: -1, rating: -1, name: 1 })
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.placeModel.countDocuments(filter).exec()
    ]);

    return {
      data: documents.map(mapPlace),
      pagination: createPaginationMeta(page, pageSize, total)
    };
  }

  async findById(id: string): Promise<Place | null> {
    const document = await this.placeModel.findOne({ id }).exec();
    return document ? mapPlace(document) : null;
  }

  async findManyByIds(ids: string[]): Promise<Place[]> {
    const documents = await this.placeModel.find({ id: { $in: ids } }).exec();
    const byId = new Map(documents.map((document) => [document.id, mapPlace(document)]));

    return ids.flatMap((id) => {
      const place = byId.get(id);
      return place ? [place] : [];
    });
  }

  async listRecommendations(query: PlaceRecommendationQuery): Promise<Place[]> {
    const mongoSort = getMongoRecommendationSort(query.sort);
    const needsDistanceSort = query.sort?.some((sort) => sort.field === "distance");
    const candidateLimit = needsDistanceSort ? Math.max(query.limit * 10, 30) : query.limit;
    const documentsQuery = this.placeModel
      .find(buildPlaceFilter(query))
      .limit(candidateLimit);

    if (Object.keys(mongoSort).length) {
      documentsQuery.sort(mongoSort);
    }

    const documents = await documentsQuery.exec();
    const places = documents.map(mapPlace);

    return sortPlaces(places, query).slice(0, query.limit);
  }

  async createApproved(input: CreateApprovedPlaceInput): Promise<Place> {
    const document = await this.placeModel.create({
      id: input.id,
      name: input.name,
      address: input.address,
      category: input.category,
      description: input.description,
      coordinates: input.coordinates,
      badges: input.badges,
      images: input.images,
      image: input.images[0] ?? "",
      hours: "",
      rating: 0,
      reviewCount: 0,
      verified: true
    });

    return mapPlace(document);
  }
}

function buildPlaceFilter(query: {
  query?: string;
  category?: string;
  categories?: string[];
  excludedCategories?: string[];
  features?: string[];
  excludedFeatures?: string[];
  verified?: boolean;
  minRating?: number;
  minReviewCount?: number;
}): FilterQuery<PlaceModel> {
  const filter: FilterQuery<PlaceModel> = {};

  if (query.query?.trim()) {
    const regex = new RegExp(escapeRegex(query.query.trim()), "i");
    filter.$or = [
      { name: regex },
      { category: regex },
      { description: regex },
      { address: regex }
    ];
  }

  const categoryFilter: { $eq?: string; $in?: string[]; $nin?: string[] } = {};

  if (query.category) {
    categoryFilter.$eq = query.category;
  }
  if (query.categories?.length) {
    categoryFilter.$in = query.categories;
  }
  if (query.excludedCategories?.length) {
    categoryFilter.$nin = query.excludedCategories;
  }

  if (Object.keys(categoryFilter).length) {
    filter.category = categoryFilter;
  }

  const badgeFilter: { $all?: string[]; $nin?: string[] } = {};

  if (query.features?.length) {
    badgeFilter.$all = query.features;
  }
  if (query.excludedFeatures?.length) {
    badgeFilter.$nin = query.excludedFeatures;
  }

  if (Object.keys(badgeFilter).length) {
    filter.badges = badgeFilter;
  }

  if (query.verified !== undefined) {
    filter.verified = query.verified;
  }

  if (query.minRating !== undefined) {
    filter.rating = { $gte: query.minRating };
  }

  if (query.minReviewCount !== undefined) {
    filter.reviewCount = { $gte: query.minReviewCount };
  }

  return filter;
}

function getMongoRecommendationSort(sort?: PlaceRecommendationSortCriterion[]) {
  const mongoSort: Record<string, 1 | -1> = {};

  for (const criterion of sort ?? []) {
    if (criterion.field !== "distance") {
      mongoSort[criterion.field] = criterion.direction;
    }
  }

  return Object.keys(mongoSort).length
    ? mongoSort
    : ({ verified: -1, rating: -1, reviewCount: -1, name: 1 } as const);
}

function sortPlaces(places: Place[], query: PlaceRecommendationQuery) {
  const sort = query.sort?.length
    ? query.sort
    : ([
        { field: "verified", direction: -1 },
        { field: "rating", direction: -1 },
        { field: "reviewCount", direction: -1 },
        { field: "name", direction: 1 }
      ] satisfies PlaceRecommendationSortCriterion[]);

  return [...places].sort((left, right) => {
    for (const criterion of sort) {
      const comparison = comparePlaces(left, right, criterion, query);

      if (comparison !== 0) {
        return comparison;
      }
    }

    return left.name.localeCompare(right.name);
  });
}

function comparePlaces(
  left: Place,
  right: Place,
  criterion: PlaceRecommendationSortCriterion,
  query: PlaceRecommendationQuery
) {
  if (criterion.field === "distance") {
    if (!query.location) {
      return 0;
    }

    return (
      compareNumbers(
        getDistanceKm(left, query.location),
        getDistanceKm(right, query.location)
      ) * criterion.direction
    );
  }

  if (criterion.field === "name") {
    return left.name.localeCompare(right.name) * criterion.direction;
  }

  return (
    compareNumbers(getSortableValue(left, criterion.field), getSortableValue(right, criterion.field)) *
    criterion.direction
  );
}

function getSortableValue(
  place: Place,
  field: Exclude<PlaceRecommendationSortCriterion["field"], "distance" | "name">
) {
  if (field === "verified") {
    return place.verified ? 1 : 0;
  }

  if (field === "createdAt") {
    return place.createdAt?.getTime() ?? 0;
  }

  return place[field];
}

function compareNumbers(left: number, right: number) {
  return left === right ? 0 : left > right ? 1 : -1;
}

function getDistanceKm(
  place: Place,
  origin: NonNullable<PlaceRecommendationQuery["location"]>
) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(place.coordinates.lat - origin.lat);
  const dLng = toRadians(place.coordinates.lng - origin.lng);
  const lat1 = toRadians(origin.lat);
  const lat2 = toRadians(place.coordinates.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

@Injectable()
export class MongoosePlaceSubmissionRepository
  implements PlaceSubmissionRepository
{
  constructor(
    @InjectModel(PlaceSubmissionModel.name)
    private readonly placeSubmissionModel: Model<PlaceSubmissionModel>
  ) {}

  async create(input: CreatePlaceSubmissionInput): Promise<PlaceSubmission> {
    const submittedBy = toObjectId(input.submittedBy);

    if (!submittedBy) {
      throw new Error("Invalid user id.");
    }

    const document = await this.placeSubmissionModel.create({
      ...input,
      id: createPublicId("place"),
      status: "pending",
      submittedBy
    });

    return mapPlaceSubmission(document);
  }

  async findById(id: string): Promise<PlaceSubmission | null> {
    const document = await this.placeSubmissionModel.findOne({ id }).exec();
    return document ? mapPlaceSubmission(document) : null;
  }

  async countByUserId(userId: string): Promise<number> {
    const objectId = toObjectId(userId);

    if (!objectId) {
      return 0;
    }

    return this.placeSubmissionModel.countDocuments({ submittedBy: objectId }).exec();
  }

  async listPendingAdmin(query: PlaceSubmissionListQuery) {
    const { page, pageSize, skip } = normalizePagination(query);
    const filter: FilterQuery<PlaceSubmissionModel> = {
      status: "pending"
    };

    if (query.query?.trim()) {
      const regex = new RegExp(escapeRegex(query.query.trim()), "i");
      filter.$or = [
        { name: regex },
        { address: regex },
        { category: regex },
        { description: regex }
      ];
    }

    const [documents, total] = await Promise.all([
      this.placeSubmissionModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.placeSubmissionModel.countDocuments(filter).exec()
    ]);

    return {
      data: documents.map(mapPlaceSubmission),
      pagination: createPaginationMeta(page, pageSize, total)
    };
  }

  async markApproved(id: string): Promise<PlaceSubmission | null> {
    const document = await this.placeSubmissionModel
      .findOneAndUpdate(
        { id, status: "pending" },
        { status: "approved" },
        { new: true }
      )
      .exec();

    return document ? mapPlaceSubmission(document) : null;
  }

  async markRejected(id: string): Promise<PlaceSubmission | null> {
    const document = await this.placeSubmissionModel
      .findOneAndUpdate(
        { id, status: "pending" },
        { status: "rejected" },
        { new: true }
      )
      .exec();

    return document ? mapPlaceSubmission(document) : null;
  }
}

export function mapPlace(document: PlaceDocument): Place {
  const object = document.toObject();

  return {
    id: object.id,
    name: object.name,
    category: object.category,
    description: object.description,
    address: object.address,
    hours: object.hours,
    image: object.image,
    images: object.images,
    rating: object.rating,
    reviewCount: object.reviewCount,
    badges: object.badges,
    verified: object.verified,
    distance: object.distance,
    coordinates: object.coordinates,
    createdAt: object.createdAt,
    updatedAt: object.updatedAt
  };
}

function mapPlaceSubmission(document: PlaceSubmissionDocument): PlaceSubmission {
  const object = document.toObject();

  return {
    id: object.id,
    name: object.name,
    address: object.address,
    category: object.category,
    description: object.description,
    coordinates: object.coordinates,
    badges: object.badges,
    images: object.images,
    menuText: object.menuText,
    status: object.status,
    submittedAt: (object.createdAt ?? new Date()).toISOString(),
    submittedBy: object.submittedBy.toString()
  };
}
