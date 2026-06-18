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

    if (query.category) {
      filter.category = query.category;
    }

    if (query.features?.length) {
      filter.badges = { $all: query.features };
    }

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
    coordinates: object.coordinates
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
