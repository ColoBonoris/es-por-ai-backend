import { Inject, Injectable } from "@nestjs/common";

import {
  USER_REPOSITORY,
  type UserListQuery,
  type UserRepository
} from "@/domain/users/user.repository";

@Injectable()
export class AdminUsersService {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  listUsers(query: UserListQuery) {
    return this.users.listAdminUsers(query);
  }
}
