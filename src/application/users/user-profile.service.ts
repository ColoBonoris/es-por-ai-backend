import { Inject, Injectable, NotFoundException } from "@nestjs/common";

import {
  FAVORITE_REPOSITORY,
  type FavoriteRepository
} from "@/domain/favorites/favorite.repository";
import {
  PLACE_SUBMISSION_REPOSITORY,
  type PlaceSubmissionRepository
} from "@/domain/places/place.repository";
import {
  REVIEW_REPOSITORY,
  type ReviewRepository
} from "@/domain/reviews/review.repository";
import {
  USER_REPOSITORY,
  type UserRepository
} from "@/domain/users/user.repository";
import type {
  PermissionPreference,
  User,
  UserPreferences,
  UserProfile,
  UserSettings
} from "@/domain/users/user.entity";

@Injectable()
export class UserProfileService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(REVIEW_REPOSITORY) private readonly reviews: ReviewRepository,
    @Inject(FAVORITE_REPOSITORY) private readonly favorites: FavoriteRepository,
    @Inject(PLACE_SUBMISSION_REPOSITORY)
    private readonly placeSubmissions: PlaceSubmissionRepository
  ) {}

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.findUserOrThrow(userId);
    return this.toProfile(user);
  }

  async updatePreferences(userId: string, preferences: UserPreferences) {
    const user = await this.users.updatePreferences(userId, preferences);
    return this.toProfile(this.ensureUser(user));
  }

  async updateSettings(userId: string, settings: UserSettings) {
    const user = await this.users.updateSettings(userId, settings);
    return this.toProfile(this.ensureUser(user));
  }

  async updatePermissions(userId: string, permissions: PermissionPreference) {
    const user = await this.findUserOrThrow(userId);
    const nextUser = await this.users.updateSettings(userId, {
      ...user.settings,
      permissions
    });
    return this.toProfile(this.ensureUser(nextUser));
  }

  private async findUserOrThrow(userId: string) {
    return this.ensureUser(await this.users.findById(userId));
  }

  private ensureUser(user: User | null): User {
    if (!user) {
      throw new NotFoundException("Usuario no encontrado.");
    }

    return user;
  }

  private async toProfile(user: User): Promise<UserProfile> {
    const [reviews, favorites, submittedPlaces] = await Promise.all([
      this.reviews.countByUserId(user.id),
      this.favorites.countByUserId(user.id),
      this.placeSubmissions.countByUserId(user.id)
    ]);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      stats: {
        reviews,
        favorites,
        submittedPlaces
      },
      preferences: user.preferences,
      settings: user.settings
    };
  }
}
