import type { AccessibilityFeature } from "@/domain/common/accessibility-feature";
import type {
  PlaceRecommendationSortCriterion,
  PlaceRecommendationUserLocation
} from "@/domain/places/place.repository";

export interface AssistantIntent {
  isRelevant: boolean;
  query?: string;
  categories?: string[];
  excludedCategories?: string[];
  features?: AccessibilityFeature[];
  excludedFeatures?: AccessibilityFeature[];
  verified?: boolean;
  minRating?: number;
  minReviewCount?: number;
  sort?: PlaceRecommendationSortCriterion[];
}

export interface AssistantResponse {
  message: string;
  recommendations: string[];
}

export interface AssistantRequestContext {
  location?: PlaceRecommendationUserLocation;
}
