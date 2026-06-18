import { Module } from "@nestjs/common";

import { MetadataService } from "@/application/metadata/metadata.service";
import { MetadataController } from "@/presentation/metadata/metadata.controller";

@Module({
  controllers: [MetadataController],
  providers: [MetadataService]
})
export class MetadataModule {}
