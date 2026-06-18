import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import type { AccessibilityFeature } from "@/domain/common/accessibility-feature";
import {
  PLACE_REPOSITORY,
  type PlaceRepository
} from "@/domain/places/place.repository";
import {
  REVIEW_REPOSITORY,
  type ReviewRepository
} from "@/domain/reviews/review.repository";
import {
  USER_REPOSITORY,
  type UserRepository
} from "@/domain/users/user.repository";

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly reviews: ReviewRepository,
    @Inject(PLACE_REPOSITORY) private readonly places: PlaceRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository
  ) {}

  listForPlace(placeId: string) {
    return this.reviews.listForPlace(placeId);
  }

  listRecent() {
    return this.reviews.listRecent(5);
  }

  async create(input: {
    placeId: string;
    userId: string;
    rating: number;
    text: string;
    images: string[];
    accessibilityFeedback: AccessibilityFeature[];
  }) {
    const [place, user] = await Promise.all([
      this.places.findById(input.placeId),
      this.users.findById(input.userId)
    ]);

    if (!place) {
      throw new NotFoundException("Lugar no encontrado.");
    }

    if (!user) {
      throw new NotFoundException("Usuario no encontrado.");
    }

    return this.reviews.create({
      ...input,
      userName: user.name,
      userAvatar: user.avatar
    });
  }
}
