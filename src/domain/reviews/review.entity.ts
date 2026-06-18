import type { AccessibilityFeature } from "@/domain/common/accessibility-feature";

export interface Review {
  id: string;
  placeId: string;
  userId?: string;
  userName: string;
  userAvatar: string;
  rating: number;
  dateLabel: string;
  text: string;
  images: string[];
  accessibilityFeedback?: AccessibilityFeature[];
  createdAt?: Date;
}
