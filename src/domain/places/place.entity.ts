import type { AccessibilityFeature } from "@/domain/common/accessibility-feature";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Place {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  hours: string;
  image: string;
  images: string[];
  rating: number;
  reviewCount: number;
  badges: AccessibilityFeature[];
  verified: boolean;
  distance?: string;
  coordinates: Coordinates;
  isFavorite?: boolean;
}

export interface PlaceSubmission {
  id: string;
  name: string;
  address: string;
  category: string;
  description: string;
  badges: AccessibilityFeature[];
  images: string[];
  menuText?: string;
  status: "pending";
  submittedAt: string;
  submittedBy: string;
}
