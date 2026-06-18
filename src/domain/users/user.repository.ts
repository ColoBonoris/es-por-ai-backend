import type {
  AdminUserListItem,
  User,
  UserPreferences,
  UserSettings
} from "@/domain/users/user.entity";
import type { PaginatedResult, PaginationQuery } from "@/domain/common/pagination";
import type { UserRole } from "@/domain/users/user-role.enum";

export interface UserListQuery extends PaginationQuery {
  query?: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  owner?: boolean;
  preferences: UserPreferences;
  settings: UserSettings;
  avatar: string;
}

export interface UserRepository {
  create(input: CreateUserInput): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  updatePreferences(id: string, preferences: UserPreferences): Promise<User | null>;
  updateSettings(id: string, settings: UserSettings): Promise<User | null>;
  listAdminUsers(query: UserListQuery): Promise<PaginatedResult<AdminUserListItem>>;
}

export const USER_REPOSITORY = Symbol("USER_REPOSITORY");
