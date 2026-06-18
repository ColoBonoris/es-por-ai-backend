import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

import type { AccessibilityFeature } from "@/domain/common/accessibility-feature";

export type ReviewDocument = HydratedDocument<ReviewModel>;

@Schema({ collection: "reviews", timestamps: true })
export class ReviewModel {
  @Prop({ required: true, unique: true, index: true })
  id!: string;

  @Prop({ required: true, index: true })
  placeId!: string;

  @Prop({ type: Types.ObjectId, ref: "UserModel", index: true })
  userId?: Types.ObjectId;

  @Prop({ required: true })
  userName!: string;

  @Prop({ required: true })
  userAvatar!: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating!: number;

  @Prop({ default: "Recién" })
  dateLabel!: string;

  @Prop({ required: true })
  text!: string;

  @Prop({ type: [String], default: [] })
  images!: string[];

  @Prop({ type: [String], default: [] })
  accessibilityFeedback?: AccessibilityFeature[];

  createdAt?: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(ReviewModel);
