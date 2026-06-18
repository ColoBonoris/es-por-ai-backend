import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

import type { AccessibilityFeature } from "@/domain/common/accessibility-feature";

export type PlaceSubmissionDocument = HydratedDocument<PlaceSubmissionModel>;

@Schema({ collection: "place_submissions", timestamps: true })
export class PlaceSubmissionModel {
  @Prop({ required: true, unique: true, index: true })
  id!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true })
  address!: string;

  @Prop({ required: true })
  category!: string;

  @Prop({ default: "" })
  description!: string;

  @Prop({ type: [String], default: [] })
  badges!: AccessibilityFeature[];

  @Prop({ type: [String], default: [] })
  images!: string[];

  @Prop()
  menuText?: string;

  @Prop({ default: "pending" })
  status!: "pending";

  @Prop({ type: Types.ObjectId, ref: "UserModel", required: true, index: true })
  submittedBy!: Types.ObjectId;

  createdAt?: Date;
}

export const PlaceSubmissionSchema =
  SchemaFactory.createForClass(PlaceSubmissionModel);
