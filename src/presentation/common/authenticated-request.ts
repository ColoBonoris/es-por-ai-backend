import type { Request } from "express";

import type { AuthUser } from "@/domain/users/user.entity";

export type AuthenticatedRequest = Request & {
  user: AuthUser;
};

export type MaybeAuthenticatedRequest = Request & {
  user?: AuthUser;
};
