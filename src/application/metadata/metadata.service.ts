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
    id: "pet_friendly",
    label: "Acepta mascotas",
    shortLabel: "Mascotas"
  },
  {
    id: "visual_accessibility",
    label: "Accesibilidad visual",
    shortLabel: "Acc. visual"
  },
  {
    id: "accessible_bathroom",
    label: "Baño accesible",
    shortLabel: "Baño accesible"
  },
  {
    id: "ramp_available",
    label: "Rampa disponible",
    shortLabel: "Rampa"
  },
  {
    id: "quiet_environment",
    label: "Espacio silencioso",
    shortLabel: "Silencioso"
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
  "Farmacia",
  "Supermercado",
  "Centro cultural",
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
