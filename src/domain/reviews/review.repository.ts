import type { AccessibilityFeature } from "@/domain/common/accessibility-feature";
import type { Review } from "@/domain/reviews/review.entity";

export interface CreateReviewInput {
  placeId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  text: string;
  images: string[];
  accessibilityFeedback: AccessibilityFeature[];
}

export interface ReviewRepository {
  listForPlace(placeId: string): Promise<Review[]>;
  listRecentForPlaces(placeIds: string[], limitPerPlace: number): Promise<Map<string, Review[]>>;
  listRecent(limit: number): Promise<Review[]>;
  create(input: CreateReviewInput): Promise<Review>;
  countByUserId(userId: string): Promise<number>;
}

export const REVIEW_REPOSITORY = Symbol("REVIEW_REPOSITORY");
