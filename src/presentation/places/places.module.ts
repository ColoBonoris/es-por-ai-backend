import { Module } from "@nestjs/common";

import { PlacesService } from "@/application/places/places.service";
import { RepositoriesModule } from "@/infrastructure/repositories/repositories.module";
import { AuthModule } from "@/presentation/auth/auth.module";
import { PlacesController } from "@/presentation/places/places.controller";

@Module({
  imports: [AuthModule, RepositoriesModule],
  controllers: [PlacesController],
  providers: [PlacesService],
  exports: [PlacesService]
})
export class PlacesModule {}
