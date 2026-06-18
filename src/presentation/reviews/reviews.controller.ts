import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards
} from "@nestjs/common";

import { ReviewsService } from "@/application/reviews/reviews.service";
import { JwtAuthGuard } from "@/presentation/auth/guards/jwt-auth.guard";
import { CurrentUser } from "@/presentation/common/current-user.decorator";
import type { AuthUser } from "@/domain/users/user.entity";
import { CreateReviewDto } from "@/presentation/reviews/dto/review.dto";

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get("places/:placeId/reviews")
  async listForPlace(@Param("placeId") placeId: string) {
    return {
      reviews: await this.reviewsService.listForPlace(placeId)
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post("places/:placeId/reviews")
  async create(
    @Param("placeId") placeId: string,
    @CurrentUser() user: AuthUser,
    @Body() body: CreateReviewDto
  ) {
    return {
      review: await this.reviewsService.create({
        placeId,
        userId: user.id,
        rating: body.rating,
        text: body.text,
        images: body.images ?? [],
        accessibilityFeedback: body.accessibilityFeedback ?? []
      })
    };
  }

  @Get("reviews/recent")
  async listRecent() {
    return {
      reviews: await this.reviewsService.listRecent()
    };
  }
}
