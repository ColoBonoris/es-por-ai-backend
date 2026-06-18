import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { AssistantService } from "@/application/assistant/assistant.service";
import { JwtAuthGuard } from "@/presentation/auth/guards/jwt-auth.guard";
import { CurrentUser } from "@/presentation/common/current-user.decorator";
import type { AuthUser } from "@/domain/users/user.entity";
import { AssistantMessageDto } from "@/presentation/assistant/dto/assistant.dto";

@UseGuards(JwtAuthGuard)
@Controller("assistant")
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post("message")
  message(@CurrentUser() user: AuthUser, @Body() body: AssistantMessageDto) {
    return this.assistantService.reply(user, body.message, {
      ...(body.location ? { location: body.location } : {})
    });
  }
}
