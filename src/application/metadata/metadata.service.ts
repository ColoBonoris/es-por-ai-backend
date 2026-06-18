import { Injectable } from "@nestjs/common";

import type { FeatureDefinition } from "@/domain/common/accessibility-feature";

export const accessibilityFeatures: FeatureDefinition[] = [
  {
    id: "wheelchair",
    label: "Accesible en silla de ruedas",
    shortLabel: "Silla de ruedas"
  },
  {
    id: "gluten_free",
    label: "Sin TACC",
    shortLabel: "Sin TACC"
  },
  {
    id: "vegetarian",
    label: "Vegetariano",
    shortLabel: "Vegetariano"
  },
  {
    id: "vegan",
    label: "Vegano",
    shortLabel: "Vegano"
  },
  {
    id: "kosher",
    label: "Kosher",
    shortLabel: "Kosher"
  },
  {
    id: "pet_friendly",
    label: "Acepta mascotas",
    shortLabel: "Mascotas"
  },
  {
    id: "visual_accessibility",
    label: "Accesibilidad visual",
    shortLabel: "Acc. visual"
  }
];

export const placeCategories = [
  "Cafetería",
  "Restaurante",
  "Bar",
  "Panadería",
  "Heladería",
  "Comida saludable",
  "Librería",
  "Otro"
];

@Injectable()
export class MetadataService {
  getCategories() {
    return placeCategories;
  }

  getAccessibilityFeatures() {
    return accessibilityFeatures;
  }
}
