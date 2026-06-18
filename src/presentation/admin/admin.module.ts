import { Module } from "@nestjs/common";

import { AdminPlaceSubmissionsService } from "@/application/admin/admin-place-submissions.service";
import { AdminUsersService } from "@/application/admin/admin-users.service";
import { RepositoriesModule } from "@/infrastructure/repositories/repositories.module";
import { AdminPlaceSubmissionsController } from "@/presentation/admin/admin-place-submissions.controller";
import { AuthModule } from "@/presentation/auth/auth.module";
import { AdminUsersController } from "@/presentation/admin/admin-users.controller";

@Module({
  imports: [AuthModule, RepositoriesModule],
  controllers: [AdminUsersController, AdminPlaceSubmissionsController],
  providers: [AdminUsersService, AdminPlaceSubmissionsService]
})
export class AdminModule {}
