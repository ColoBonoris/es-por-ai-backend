import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";

import type { Review } from "@/domain/reviews/review.entity";
import type {
  CreateReviewInput,
  ReviewRepository
} from "@/domain/reviews/review.repository";
import {
  ReviewModel,
  type ReviewDocument
} from "@/infrastructure/database/schemas/review.schema";
import {
  createPublicId,
  toObjectId
} from "@/infrastructure/repositories/mongoose-utils";

@Injectable()
export class MongooseReviewRepository implements ReviewRepository {
  constructor(
    @InjectModel(ReviewModel.name) private readonly reviewModel: Model<ReviewModel>
  ) {}

  async listForPlace(placeId: string): Promise<Review[]> {
    const documents = await this.reviewModel
      .find({ placeId })
      .sort({ createdAt: -1 })
      .exec();
    return documents.map(mapReview);
  }

  async listRecentForPlaces(
    placeIds: string[],
    limitPerPlace: number
  ): Promise<Map<string, Review[]>> {
    if (!placeIds.length || limitPerPlace < 1) {
      return new Map();
    }

    const documents = await this.reviewModel
      .find({ placeId: { $in: placeIds } })
      .sort({ createdAt: -1 })
      .exec();
    const reviewsByPlaceId = new Map<string, Review[]>();

    for (const review of documents.map(mapReview)) {
      const reviews = reviewsByPlaceId.get(review.placeId) ?? [];

      if (reviews.length < limitPerPlace) {
        reviews.push(review);
        reviewsByPlaceId.set(review.placeId, reviews);
      }
    }

    return reviewsByPlaceId;
  }

  async listRecent(limit: number): Promise<Review[]> {
    const documents = await this.reviewModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    return documents.map(mapReview);
  }

  async create(input: CreateReviewInput): Promise<Review> {
    const userId = toObjectId(input.userId);

    if (!userId) {
      throw new Error("Invalid user id.");
    }

    const document = await this.reviewModel.create({
      ...input,
      id: createPublicId("review"),
      userId,
      dateLabel: "Recién"
    });

    return mapReview(document);
  }

  async countByUserId(userId: string): Promise<number> {
    const objectId = toObjectId(userId);

    if (!objectId) {
      return 0;
    }

    return this.reviewModel.countDocuments({ userId: objectId }).exec();
  }
}

function mapReview(document: ReviewDocument): Review {
  const object = document.toObject();

  return {
    id: object.id,
    placeId: object.placeId,
    userId: object.userId?.toString(),
    userName: object.userName,
    userAvatar: object.userAvatar,
    rating: object.rating,
    dateLabel: object.dateLabel,
    text: object.text,
    images: object.images,
    accessibilityFeedback: object.accessibilityFeedback,
    createdAt: object.createdAt
  };
}
