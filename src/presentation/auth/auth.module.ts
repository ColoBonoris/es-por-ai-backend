import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";

import { AuthService } from "@/application/auth/auth.service";
import { RepositoriesModule } from "@/infrastructure/repositories/repositories.module";
import { AuthController } from "@/presentation/auth/auth.controller";
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard
} from "@/presentation/auth/guards/jwt-auth.guard";
import { RolesGuard } from "@/presentation/auth/guards/roles.guard";

@Module({
  imports: [JwtModule.register({}), RepositoriesModule],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, OptionalJwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtAuthGuard, OptionalJwtAuthGuard, RolesGuard]
})
export class AuthModule {}
