export const accessibilityFeatureValues = [
  "wheelchair",
  "gluten_free",
  "vegetarian",
  "vegan",
  "pet_friendly",
  "visual_accessibility",
  "accessible_bathroom",
  "ramp_available",
  "quiet_environment"
] as const;

export type AccessibilityFeature = (typeof accessibilityFeatureValues)[number];

export interface FeatureDefinition {
  id: AccessibilityFeature;
  label: string;
  shortLabel: string;
}
