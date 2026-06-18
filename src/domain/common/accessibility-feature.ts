export const accessibilityFeatureValues = [
  "wheelchair",
  "gluten_free",
  "vegetarian",
  "vegan",
  "kosher",
  "pet_friendly",
  "visual_accessibility"
] as const;

export type AccessibilityFeature = (typeof accessibilityFeatureValues)[number];

export interface FeatureDefinition {
  id: AccessibilityFeature;
  label: string;
  shortLabel: string;
}
