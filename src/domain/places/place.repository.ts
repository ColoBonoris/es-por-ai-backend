import type { AccessibilityFeature } from "@/domain/common/accessibility-feature";
import type { PaginatedResult, PaginationQuery } from "@/domain/common/pagination";
import type { Place, PlaceSubmission } from "@/domain/places/place.entity";

export interface PlaceListQuery extends PaginationQuery {
  query?: string;
  category?: string;
  features?: AccessibilityFeature[];
}

export interface CreatePlaceSubmissionInput {
  name: string;
  address: string;
  category: string;
  description: string;
  badges: AccessibilityFeature[];
  images: string[];
  menuText?: string;
  submittedBy: string;
}

export interface PlaceRepository {
  list(query: PlaceListQuery): Promise<PaginatedResult<Place>>;
  findById(id: string): Promise<Place | null>;
  findManyByIds(ids: string[]): Promise<Place[]>;
}

export interface PlaceSubmissionRepository {
  create(input: CreatePlaceSubmissionInput): Promise<PlaceSubmission>;
  countByUserId(userId: string): Promise<number>;
}

export const PLACE_REPOSITORY = Symbol("PLACE_REPOSITORY");
export const PLACE_SUBMISSION_REPOSITORY = Symbol("PLACE_SUBMISSION_REPOSITORY");
