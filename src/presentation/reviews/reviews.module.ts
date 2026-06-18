import { Module } from "@nestjs/common";

import { ReviewsService } from "@/application/reviews/reviews.service";
import { RepositoriesModule } from "@/infrastructure/repositories/repositories.module";
import { AuthModule } from "@/presentation/auth/auth.module";
import { ReviewsController } from "@/presentation/reviews/reviews.controller";

@Module({
  imports: [AuthModule, RepositoriesModule],
  controllers: [ReviewsController],
  providers: [ReviewsService]
})
export class ReviewsModule {}
