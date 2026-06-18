import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type FavoriteDocument = HydratedDocument<FavoriteModel>;

@Schema({ collection: "favorites", timestamps: true })
export class FavoriteModel {
  @Prop({ type: Types.ObjectId, ref: "UserModel", required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  placeId!: string;

  createdAt?: Date;
}

export const FavoriteSchema = SchemaFactory.createForClass(FavoriteModel);
FavoriteSchema.index({ userId: 1, placeId: 1 }, { unique: true });
