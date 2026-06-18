import { Module } from "@nestjs/common";

import { FavoritesService } from "@/application/favorites/favorites.service";
import { RepositoriesModule } from "@/infrastructure/repositories/repositories.module";
import { AuthModule } from "@/presentation/auth/auth.module";
import { FavoritesController } from "@/presentation/favorites/favorites.controller";

@Module({
  imports: [AuthModule, RepositoriesModule],
  controllers: [FavoritesController],
  providers: [FavoritesService]
})
export class FavoritesModule {}
