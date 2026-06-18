import { normalizeUserRole, UserRole } from "@/domain/users/user-role.enum";

describe("normalizeUserRole", () => {
  it("falls back to CLIENT when role is missing or unknown", () => {
    expect(normalizeUserRole()).toBe(UserRole.CLIENT);
    expect(normalizeUserRole(null)).toBe(UserRole.CLIENT);
    expect(normalizeUserRole("EDITOR")).toBe(UserRole.CLIENT);
  });

  it("keeps ADMIN when role is explicitly ADMIN", () => {
    expect(normalizeUserRole("ADMIN")).toBe(UserRole.ADMIN);
  });
});
