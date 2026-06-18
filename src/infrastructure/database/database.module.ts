import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";

import {
  FavoriteModel,
  FavoriteSchema
} from "@/infrastructure/database/schemas/favorite.schema";
import {
  PlaceModel,
  PlaceSchema
} from "@/infrastructure/database/schemas/place.schema";
import {
  PlaceSubmissionModel,
  PlaceSubmissionSchema
} from "@/infrastructure/database/schemas/place-submission.schema";
import {
  RefreshTokenModel,
  RefreshTokenSchema
} from "@/infrastructure/database/schemas/refresh-token.schema";
import {
  ReviewModel,
  ReviewSchema
} from "@/infrastructure/database/schemas/review.schema";
import { UserModel, UserSchema } from "@/infrastructure/database/schemas/user.schema";

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>("MONGODB_URI");

        if (!uri) {
          throw new Error("MONGODB_URI is required.");
        }

        return {
          uri
        };
      }
    }),
    MongooseModule.forFeature([
      { name: UserModel.name, schema: UserSchema },
      { name: RefreshTokenModel.name, schema: RefreshTokenSchema },
      { name: PlaceModel.name, schema: PlaceSchema },
      { name: PlaceSubmissionModel.name, schema: PlaceSubmissionSchema },
      { name: FavoriteModel.name, schema: FavoriteSchema },
      { name: ReviewModel.name, schema: ReviewSchema }
    ])
  ],
  exports: [MongooseModule]
})
export class DatabaseModule {}
