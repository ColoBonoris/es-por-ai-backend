import type { AccessibilityFeature } from "@/domain/common/accessibility-feature";
import type { PaginatedResult, PaginationQuery } from "@/domain/common/pagination";
import type {
  AdminPlaceSubmissionListItem,
  Coordinates,
  Place,
  PlaceSubmission
} from "@/domain/places/place.entity";

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
  coordinates: Coordinates;
  badges: AccessibilityFeature[];
  images: string[];
  menuText?: string;
  submittedBy: string;
}

export interface CreateApprovedPlaceInput {
  id: string;
  name: string;
  address: string;
  category: string;
  description: string;
  coordinates: Coordinates;
  badges: AccessibilityFeature[];
  images: string[];
}

export interface PlaceSubmissionListQuery extends PaginationQuery {
  query?: string;
}

export interface PlaceRepository {
  list(query: PlaceListQuery): Promise<PaginatedResult<Place>>;
  findById(id: string): Promise<Place | null>;
  findManyByIds(ids: string[]): Promise<Place[]>;
  createApproved(input: CreateApprovedPlaceInput): Promise<Place>;
}

export interface PlaceSubmissionRepository {
  create(input: CreatePlaceSubmissionInput): Promise<PlaceSubmission>;
  findById(id: string): Promise<PlaceSubmission | null>;
  countByUserId(userId: string): Promise<number>;
  listPendingAdmin(
    query: PlaceSubmissionListQuery
  ): Promise<PaginatedResult<AdminPlaceSubmissionListItem>>;
  markApproved(id: string): Promise<PlaceSubmission | null>;
  markRejected(id: string): Promise<PlaceSubmission | null>;
}

export const PLACE_REPOSITORY = Symbol("PLACE_REPOSITORY");
export const PLACE_SUBMISSION_REPOSITORY = Symbol("PLACE_SUBMISSION_REPOSITORY");
