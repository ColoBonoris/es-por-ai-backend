import type { AssistantIntent } from "@/domain/assistant/assistant.entity";
import type { AccessibilityFeature } from "@/domain/common/accessibility-feature";
import type { Place } from "@/domain/places/place.entity";
import type { Review } from "@/domain/reviews/review.entity";

export interface ChatbotAnalysisContext {
  userPreferenceFeatures: AccessibilityFeature[];
  hasLocation: boolean;
}

export interface ChatbotProvider {
  analyzeMessage(
    message: string,
    context: ChatbotAnalysisContext
  ): Promise<AssistantIntent | null>;
  createRecommendationMessage(input: {
    userMessage: string;
    places: Place[];
    reviewsByPlaceId: Map<string, Review[]>;
  }): Promise<string | null>;
}

export const CHATBOT_PROVIDER = Symbol("CHATBOT_PROVIDER");
