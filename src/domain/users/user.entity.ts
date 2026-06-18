import type { AccessibilityFeature } from "@/domain/common/accessibility-feature";
import type { UserRole } from "@/domain/users/user-role.enum";

export type ThemePreference = "light" | "dark" | "high-contrast";

export interface UserPreferences {
  accessibilityFeatures: AccessibilityFeature[];
}

export interface PermissionPreference {
  location: boolean;
  camera: boolean;
  notifications: boolean;
}

export interface UserSettings {
  theme: ThemePreference;
  notifications: {
    reviews: boolean;
    recommendations: boolean;
  };
  permissions: PermissionPreference;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  owner: boolean;
  preferences?: UserPreferences;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  owner: boolean;
  avatar: string;
  preferences: UserPreferences;
  settings: UserSettings;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserStats {
  reviews: number;
  favorites: number;
  submittedPlaces: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  stats: UserStats;
  preferences: UserPreferences;
  settings: UserSettings;
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  createdAt?: string;
}

export const defaultUserPreferences: UserPreferences = {
  accessibilityFeatures: []
};

export const defaultUserSettings: UserSettings = {
  theme: "light",
  notifications: {
    reviews: true,
    recommendations: false
  },
  permissions: {
    location: false,
    camera: false,
    notifications: false
  }
};

export function createAvatarInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.at(0)?.toUpperCase() ?? "")
    .join("");

  return initials || "AI";
}

export function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    owner: user.owner,
    preferences: user.preferences
  };
}
