import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { AdminModule } from "@/presentation/admin/admin.module";
import { AssistantModule } from "@/presentation/assistant/assistant.module";
import { AuthModule } from "@/presentation/auth/auth.module";
import { FavoritesModule } from "@/presentation/favorites/favorites.module";
import { MetadataModule } from "@/presentation/metadata/metadata.module";
import { PlacesModule } from "@/presentation/places/places.module";
import { ReviewsModule } from "@/presentation/reviews/reviews.module";
import { UsersModule } from "@/presentation/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120
      }
    ]),
    AuthModule,
    AssistantModule,
    UsersModule,
    PlacesModule,
    FavoritesModule,
    ReviewsModule,
    MetadataModule,
    AdminModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class AppModule {}
