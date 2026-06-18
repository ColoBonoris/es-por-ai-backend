import { Module } from "@nestjs/common";

import { AdminUsersService } from "@/application/admin/admin-users.service";
import { RepositoriesModule } from "@/infrastructure/repositories/repositories.module";
import { AuthModule } from "@/presentation/auth/auth.module";
import { AdminUsersController } from "@/presentation/admin/admin-users.controller";

@Module({
  imports: [AuthModule, RepositoriesModule],
  controllers: [AdminUsersController],
  providers: [AdminUsersService]
})
export class AdminModule {}
