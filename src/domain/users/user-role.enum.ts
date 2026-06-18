export enum UserRole {
  CLIENT = "CLIENT",
  ADMIN = "ADMIN"
}

export function normalizeUserRole(role?: string | null): UserRole {
  return role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.CLIENT;
}
