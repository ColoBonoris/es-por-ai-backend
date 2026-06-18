import { Module } from "@nestjs/common";

import { AssistantService } from "@/application/assistant/assistant.service";
import { CHATBOT_PROVIDER } from "@/application/assistant/chatbot-provider";
import { RepositoriesModule } from "@/infrastructure/repositories/repositories.module";
import { AnthropicChatbotProvider } from "@/infrastructure/chatbot/anthropic-chatbot.provider";
import { AssistantController } from "@/presentation/assistant/assistant.controller";
import { AuthModule } from "@/presentation/auth/auth.module";

@Module({
  imports: [AuthModule, RepositoriesModule],
  controllers: [AssistantController],
  providers: [
    AssistantService,
    {
      provide: CHATBOT_PROVIDER,
      useClass: AnthropicChatbotProvider
    }
  ]
})
export class AssistantModule {}
