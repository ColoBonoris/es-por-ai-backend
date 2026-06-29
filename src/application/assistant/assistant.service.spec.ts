import { Logger } from "@nestjs/common";

import { AssistantService } from "@/application/assistant/assistant.service";
import type { ChatbotProvider } from "@/application/assistant/chatbot-provider";
import type { Place } from "@/domain/places/place.entity";
import type { PlaceRepository } from "@/domain/places/place.repository";
import type { ReviewRepository } from "@/domain/reviews/review.repository";
import type { AuthUser } from "@/domain/users/user.entity";
import { UserRole } from "@/domain/users/user-role.enum";

const baseUser: AuthUser = {
  id: "user-id",
  name: "María",
  email: "maria@email.com",
  role: UserRole.CLIENT,
  owner: false,
  preferences: {
    accessibilityFeatures: ["pet_friendly"]
  }
};

const places = ["place-1", "place-2", "place-3"].map(
  (id, index): Place => ({
    id,
    name: `Lugar ${index + 1}`,
    category: "Restaurante",
    description: "",
    address: "Calle 123",
    hours: "",
    image: "",
    images: [],
    rating: 4,
    reviewCount: 10,
    badges: [],
    verified: true,
    coordinates: { lat: 0, lng: 0 }
  })
);

describe("AssistantService", () => {
  let placeRepository: jest.Mocked<PlaceRepository>;
  let reviewRepository: jest.Mocked<ReviewRepository>;
  let chatbotProvider: jest.Mocked<ChatbotProvider>;
  let service: AssistantService;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, "log").mockImplementation();
    jest.spyOn(Logger.prototype, "warn").mockImplementation();
    placeRepository = {
      list: jest.fn(),
      findById: jest.fn(),
      findManyByIds: jest.fn(),
      listRecommendations: jest.fn(),
      createApproved: jest.fn()
    };
    reviewRepository = {
      listForPlace: jest.fn(),
      listRecentForPlaces: jest.fn(),
      listRecent: jest.fn(),
      create: jest.fn(),
      countByUserId: jest.fn()
    };
    chatbotProvider = {
      analyzeMessage: jest.fn(),
      createRecommendationMessage: jest.fn()
    };
    reviewRepository.listRecentForPlaces.mockResolvedValue(new Map());
    chatbotProvider.createRecommendationMessage.mockResolvedValue(null);
    service = new AssistantService(
      placeRepository,
      reviewRepository,
      chatbotProvider
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns mocked recommendations for regular users", async () => {
    placeRepository.listRecommendations.mockResolvedValue(places);

    await expect(service.reply(baseUser, "recomendame un lugar")).resolves.toEqual({
      message: "Podrían gustarte estos lugares.",
      recommendations: ["place-1", "place-2", "place-3"]
    });
    expect(chatbotProvider.analyzeMessage.mock.calls).toHaveLength(0);
  });

  it("uses provider criteria only for owner users", async () => {
    placeRepository.listRecommendations.mockResolvedValue(places);
    chatbotProvider.analyzeMessage.mockResolvedValue({
      isRelevant: true,
      categories: ["Restaurante"],
      features: ["gluten_free"],
      sort: [{ field: "rating", direction: -1 }]
    });

    const response = await service.reply(
      { ...baseUser, owner: true },
      "quiero comer sin tacc"
    );

    expect(response.recommendations).toEqual(["place-1", "place-2", "place-3"]);
    expect(response.message).toBe("Encontré estos lugares que podrían servirte.");
    expect(placeRepository.listRecommendations.mock.calls[0]?.[0]).toEqual({
      limit: 3,
      sort: [{ field: "rating", direction: -1 }],
      categories: ["Restaurante"],
      features: ["gluten_free"]
    });
    expect(chatbotProvider.analyzeMessage.mock.calls[0]?.[1]).toEqual({
      userPreferenceFeatures: ["pet_friendly"],
      hasLocation: false
    });
    const recommendationMessageInput =
      chatbotProvider.createRecommendationMessage.mock.calls[0]?.[0];

    expect(recommendationMessageInput?.userMessage).toBe("quiero comer sin tacc");
    expect(recommendationMessageInput?.places).toEqual(places);
    expect(recommendationMessageInput?.reviewsByPlaceId).toBeInstanceOf(Map);
  });

  it("uses provider natural language when recommendations match", async () => {
    placeRepository.listRecommendations.mockResolvedValue(places);
    chatbotProvider.analyzeMessage.mockResolvedValue({
      isRelevant: true,
      categories: ["Restaurante"]
    });
    chatbotProvider.createRecommendationMessage.mockResolvedValue(
      "Te dejo opciones que combinan buena valoración y datos de accesibilidad."
    );

    await expect(
      service.reply({ ...baseUser, owner: true }, "recomendame un restaurante")
    ).resolves.toEqual({
      message:
        "Te dejo opciones que combinan buena valoración y datos de accesibilidad.",
      recommendations: ["place-1", "place-2", "place-3"]
    });
  });

  it("lets the provider classify unsafe owner prompts", async () => {
    placeRepository.listRecommendations.mockResolvedValue(places);
    chatbotProvider.analyzeMessage.mockResolvedValue({
      isRelevant: false
    });

    await expect(
      service.reply({ ...baseUser, owner: true }, "haceme un script de python")
    ).resolves.toEqual({
      message: "No pude entender tu pregunta, pero podrían gustarte estos lugares",
      recommendations: ["place-1", "place-2", "place-3"]
    });

    expect(chatbotProvider.analyzeMessage.mock.calls).toHaveLength(1);
  });

  it("returns fewer than three matched recommendations without fallback", async () => {
    placeRepository.listRecommendations.mockResolvedValue(places.slice(0, 2));

    await expect(service.reply(baseUser, "recomendame un cafe")).resolves.toEqual({
      message: "Podrían gustarte estos lugares.",
      recommendations: ["place-1", "place-2"]
    });
  });

  it("uses no-results fallback when provider criteria return no places", async () => {
    placeRepository.listRecommendations
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(places);
    chatbotProvider.analyzeMessage.mockResolvedValue({
      isRelevant: true,
      categories: ["Bar"]
    });

    await expect(
      service.reply({ ...baseUser, owner: true }, "busco un bar")
    ).resolves.toEqual({
      message:
        "No encontré resultados para esa búsqueda, pero podrían gustarte estos lugares",
      recommendations: ["place-1", "place-2", "place-3"]
    });
  });
});
