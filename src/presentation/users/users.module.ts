import { Module } from "@nestjs/common";

import { UserProfileService } from "@/application/users/user-profile.service";
import { RepositoriesModule } from "@/infrastructure/repositories/repositories.module";
import { AuthModule } from "@/presentation/auth/auth.module";
import { UsersController } from "@/presentation/users/users.controller";

@Module({
  imports: [AuthModule, RepositoriesModule],
  controllers: [UsersController],
  providers: [UserProfileService]
})
export class UsersModule {}
