import { Controller, Get } from "@nestjs/common";

import { MetadataService } from "@/application/metadata/metadata.service";

@Controller("metadata")
export class MetadataController {
  constructor(private readonly metadataService: MetadataService) {}

  @Get("categories")
  getCategories() {
    return {
      categories: this.metadataService.getCategories()
    };
  }

  @Get("accessibility-features")
  getAccessibilityFeatures() {
    return {
      accessibilityFeatures: this.metadataService.getAccessibilityFeatures()
    };
  }
}
