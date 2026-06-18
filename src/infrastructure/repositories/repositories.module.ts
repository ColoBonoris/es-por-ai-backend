import { Module } from "@nestjs/common";

import { PASSWORD_HASHER } from "@/application/auth/password-hasher";
import { REFRESH_TOKEN_REPOSITORY } from "@/domain/auth/refresh-token.repository";
import { FAVORITE_REPOSITORY } from "@/domain/favorites/favorite.repository";
import {
  PLACE_REPOSITORY,
  PLACE_SUBMISSION_REPOSITORY
} from "@/domain/places/place.repository";
import { REVIEW_REPOSITORY } from "@/domain/reviews/review.repository";
import { USER_REPOSITORY } from "@/domain/users/user.repository";
import { DatabaseModule } from "@/infrastructure/database/database.module";
import { MongooseFavoriteRepository } from "@/infrastructure/repositories/mongoose-favorite.repository";
import {
  MongoosePlaceRepository,
  MongoosePlaceSubmissionRepository
} from "@/infrastructure/repositories/mongoose-place.repository";
import { MongooseRefreshTokenRepository } from "@/infrastructure/repositories/mongoose-refresh-token.repository";
import { MongooseReviewRepository } from "@/infrastructure/repositories/mongoose-review.repository";
import { MongooseUserRepository } from "@/infrastructure/repositories/mongoose-user.repository";
import { BcryptPasswordHasher } from "@/infrastructure/security/bcrypt-password-hasher";

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: MongooseUserRepository
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: MongooseRefreshTokenRepository
    },
    {
      provide: PLACE_REPOSITORY,
      useClass: MongoosePlaceRepository
    },
    {
      provide: PLACE_SUBMISSION_REPOSITORY,
      useClass: MongoosePlaceSubmissionRepository
    },
    {
      provide: FAVORITE_REPOSITORY,
      useClass: MongooseFavoriteRepository
    },
    {
      provide: REVIEW_REPOSITORY,
      useClass: MongooseReviewRepository
    },
    {
      provide: PASSWORD_HASHER,
      useClass: BcryptPasswordHasher
    }
  ],
  exports: [
    USER_REPOSITORY,
    REFRESH_TOKEN_REPOSITORY,
    PLACE_REPOSITORY,
    PLACE_SUBMISSION_REPOSITORY,
    FAVORITE_REPOSITORY,
    REVIEW_REPOSITORY,
    PASSWORD_HASHER
  ]
})
export class RepositoriesModule {}
