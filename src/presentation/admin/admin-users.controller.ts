import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { AdminUsersService } from "@/application/admin/admin-users.service";
import { UserRole } from "@/domain/users/user-role.enum";
import { JwtAuthGuard } from "@/presentation/auth/guards/jwt-auth.guard";
import { Roles, RolesGuard } from "@/presentation/auth/guards/roles.guard";
import { PaginationQueryDto } from "@/presentation/common/dto/pagination-query.dto";
import { IsOptional, IsString } from "class-validator";

class AdminUsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  query?: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/users")
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  listUsers(@Query() query: AdminUsersQueryDto) {
    return this.adminUsersService.listUsers(query);
  }
}
