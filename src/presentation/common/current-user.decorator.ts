import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import type { AuthUser } from "@/domain/users/user.entity";
import type { AuthenticatedRequest } from "@/presentation/common/authenticated-request";

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  }
);
