import { Inject, Injectable, Logger } from "@nestjs/common";

import {
  CHATBOT_PROVIDER,
  type ChatbotProvider
} from "@/application/assistant/chatbot-provider";
import { placeCategories } from "@/application/metadata/metadata.service";
import {
  accessibilityFeatureValues,
  type AccessibilityFeature
} from "@/domain/common/accessibility-feature";
import type {
  AssistantIntent,
  AssistantRequestContext,
  AssistantResponse
} from "@/domain/assistant/assistant.entity";
import {
  PLACE_REPOSITORY,
  type PlaceRecommendationQuery,
  type PlaceRepository
} from "@/domain/places/place.repository";
import type { Place } from "@/domain/places/place.entity";
import {
  REVIEW_REPOSITORY,
  type ReviewRepository
} from "@/domain/reviews/review.repository";
import type { AuthUser } from "@/domain/users/user.entity";

const DEFAULT_FALLBACK_MESSAGE = "Podrían gustarte estos lugares.";
const NOT_UNDERSTOOD_FALLBACK_MESSAGE =
  "No pude entender tu pregunta, pero podrían gustarte estos lugares";
const NO_RESULTS_FALLBACK_MESSAGE =
  "No encontré resultados para esa búsqueda, pero podrían gustarte estos lugares";
const EMPTY_MESSAGE = "No encontré suficientes lugares para recomendarte.";
const RELEVANT_MESSAGE = "Encontré estos lugares que podrían servirte.";
const RECOMMENDATION_COUNT = 3;

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  constructor(
    @Inject(PLACE_REPOSITORY) private readonly places: PlaceRepository,
    @Inject(REVIEW_REPOSITORY) private readonly reviews: ReviewRepository,
    @Inject(CHATBOT_PROVIDER) private readonly chatbotProvider: ChatbotProvider
  ) {}

  async reply(
    user: AuthUser,
    message: string,
    context: AssistantRequestContext = {}
  ): Promise<AssistantResponse> {
    const normalizedMessage = message.trim();
    const logContext = {
      userId: user.id,
      owner: user.owner,
      messageLength: normalizedMessage.length,
      hasLocation: Boolean(context.location)
    };

    if (!user.owner && !this.isSafeAppRelatedMessage(normalizedMessage)) {
      this.logger.log({
        event: "assistant_fallback",
        reason: "unsafe_or_off_topic",
        ...logContext
      });
      return this.fallback(
        "unsafe_or_off_topic",
        context,
        NOT_UNDERSTOOD_FALLBACK_MESSAGE
      );
    }

    if (user.owner) {
      const intent = await this.chatbotProvider.analyzeMessage(normalizedMessage, {
        userPreferenceFeatures: user.preferences?.accessibilityFeatures ?? [],
        hasLocation: Boolean(context.location)
      });

      if (intent?.isRelevant) {
        return this.recommendFromIntent(
          normalizedMessage,
          intent,
          context,
          logContext
        );
      }

      const reason = intent ? "irrelevant_intent" : "provider_unavailable";

      this.logger.log({
        event: "assistant_fallback",
        reason,
        ...logContext
      });

      return this.fallback(reason, context, getFallbackMessage(reason));
    }

    return this.fallback("regular_user", context, DEFAULT_FALLBACK_MESSAGE);
  }

  private async fallback(
    reason: string,
    context: AssistantRequestContext,
    message: string
  ): Promise<AssistantResponse> {
    const places = await this.places.listRecommendations({
      limit: RECOMMENDATION_COUNT,
      sort: [
        ...(context.location
          ? ([{ field: "distance", direction: 1 }] as const)
          : []),
        { field: "rating", direction: -1 },
        { field: "reviewCount", direction: -1 },
        { field: "verified", direction: -1 }
      ],
      ...(context.location ? { location: context.location } : {})
    });

    this.logger.log({
      event: "assistant_recommendations",
      source: "fallback",
      reason,
      resultCount: places.length
    });

    return toResponse(message, places);
  }

  private async recommendFromIntent(
    userMessage: string,
    intent: AssistantIntent,
    context: AssistantRequestContext,
    logContext: Record<string, unknown>
  ): Promise<AssistantResponse> {
    const query: PlaceRecommendationQuery = {
      limit: RECOMMENDATION_COUNT,
      sort: intent.sort?.length
        ? intent.sort
        : [
            { field: "verified", direction: -1 },
            { field: "rating", direction: -1 },
            { field: "reviewCount", direction: -1 }
          ],
      ...(intent.query ? { query: intent.query } : {}),
      ...(intent.categories?.length ? { categories: intent.categories } : {}),
      ...(intent.excludedCategories?.length
        ? { excludedCategories: intent.excludedCategories }
        : {}),
      ...(intent.features?.length ? { features: intent.features } : {}),
      ...(intent.excludedFeatures?.length
        ? { excludedFeatures: intent.excludedFeatures }
        : {}),
      ...(intent.verified !== undefined ? { verified: intent.verified } : {}),
      ...(intent.minRating !== undefined ? { minRating: intent.minRating } : {}),
      ...(intent.minReviewCount !== undefined
        ? { minReviewCount: intent.minReviewCount }
        : {}),
      ...(context.location ? { location: context.location } : {})
    };
    const places = await this.places.listRecommendations(query);

    this.logger.log({
      event: "assistant_recommendations",
      source: "provider",
      resultCount: places.length,
      criteria: {
        categories: query.categories,
        excludedCategories: query.excludedCategories,
        features: query.features,
        excludedFeatures: query.excludedFeatures,
        verified: query.verified,
        minRating: query.minRating,
        minReviewCount: query.minReviewCount,
        sort: query.sort
      },
      ...logContext
    });

    if (places.length === 0) {
      return this.fallback(
        "zero_provider_results",
        context,
        NO_RESULTS_FALLBACK_MESSAGE
      );
    }

    const reviewsByPlaceId = await this.reviews.listRecentForPlaces(
      places.map((place) => place.id),
      1
    );
    const message =
      (await this.chatbotProvider.createRecommendationMessage({
        userMessage,
        places,
        reviewsByPlaceId
      })) ?? RELEVANT_MESSAGE;

    return toResponse(message, places);
  }

  private isSafeAppRelatedMessage(message: string) {
    if (!message) {
      return false;
    }

    const lowerMessage = message.toLowerCase();
    const blockedTerms = [
      "script",
      "python",
      "javascript",
      "bash",
      "shell",
      "sql",
      "hack",
      "exploit",
      "malware",
      "token",
      "jwt",
      "password",
      "contraseña",
      "credencial",
      "scraping"
    ];

    if (blockedTerms.some((term) => lowerMessage.includes(term))) {
      return false;
    }

    const appTerms = [
      "lugar",
      "lugares",
      "recom",
      "comer",
      "tomar",
      "café",
      "cafe",
      "bar",
      "resto",
      "restaurante",
      "panadería",
      "panaderia",
      "helado",
      "heladería",
      "heladeria",
      "accesible",
      "accesibilidad",
      "silla",
      "ruedas",
      "tacc",
      "celíaco",
      "celiaco",
      "vegano",
      "vegetariano",
      "mascotas"
    ];
    const categoryTerms = placeCategories.map((category) => category.toLowerCase());
    const featureTerms = accessibilityFeatureValues.flatMap(featureToTerms);

    return [...appTerms, ...categoryTerms, ...featureTerms].some((term) =>
      lowerMessage.includes(term)
    );
  }
}

function getFallbackMessage(reason: string) {
  if (reason === "irrelevant_intent") {
    return NOT_UNDERSTOOD_FALLBACK_MESSAGE;
  }

  return DEFAULT_FALLBACK_MESSAGE;
}

function toResponse(message: string, places: Place[]): AssistantResponse {
  if (places.length === 0) {
    return {
      message: EMPTY_MESSAGE,
      recommendations: []
    };
  }

  return {
    message,
    recommendations: places.map((place) => place.id)
  };
}

function featureToTerms(feature: AccessibilityFeature) {
  if (feature === "gluten_free") {
    return ["gluten", "tacc", "celíaco", "celiaco"];
  }

  if (feature === "pet_friendly") {
    return ["mascota", "mascotas", "pet friendly"];
  }

  if (feature === "visual_accessibility") {
    return ["visual", "braille", "accesibilidad visual"];
  }

  if (feature === "wheelchair") {
    return ["silla", "ruedas", "wheelchair"];
  }

  if (feature === "accessible_bathroom") {
    return ["baño", "bano", "baño accesible", "bano accesible"];
  }

  if (feature === "ramp_available") {
    return ["rampa", "rampa disponible"];
  }

  if (feature === "quiet_environment") {
    return ["silencioso", "silencio", "tranquilo", "espacio silencioso"];
  }

  return [feature.replace("_", " ")];
}
