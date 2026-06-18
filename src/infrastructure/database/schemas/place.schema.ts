import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

import type { AccessibilityFeature } from "@/domain/common/accessibility-feature";
import type { Coordinates } from "@/domain/places/place.entity";

export type PlaceDocument = HydratedDocument<PlaceModel>;

@Schema({ collection: "places", timestamps: true })
export class PlaceModel {
  @Prop({ required: true, unique: true, index: true })
  id!: string;

  @Prop({ required: true, trim: true, index: true })
  name!: string;

  @Prop({ required: true, trim: true, index: true })
  category!: string;

  @Prop({ default: "" })
  description!: string;

  @Prop({ required: true })
  address!: string;

  @Prop({ default: "" })
  hours!: string;

  @Prop({ default: "" })
  image!: string;

  @Prop({ type: [String], default: [] })
  images!: string[];

  @Prop({ default: 0 })
  rating!: number;

  @Prop({ default: 0 })
  reviewCount!: number;

  @Prop({ type: [String], default: [], index: true })
  badges!: AccessibilityFeature[];

  @Prop({ default: false })
  verified!: boolean;

  @Prop()
  distance?: string;

  @Prop({ type: Object, default: { lat: 0, lng: 0 } })
  coordinates!: Coordinates;
}

export const PlaceSchema = SchemaFactory.createForClass(PlaceModel);
