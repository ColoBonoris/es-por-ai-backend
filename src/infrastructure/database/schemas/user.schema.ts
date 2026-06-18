import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

import {
  defaultUserPreferences,
  defaultUserSettings,
  type UserPreferences,
  type UserSettings
} from "@/domain/users/user.entity";
import { UserRole } from "@/domain/users/user-role.enum";

export type UserDocument = HydratedDocument<UserModel>;

@Schema({ collection: "users", timestamps: true })
export class UserModel {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, lowercase: true, trim: true, unique: true, index: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ enum: UserRole, default: UserRole.CLIENT })
  role?: UserRole;

  @Prop({ required: true })
  avatar!: string;

  @Prop({ type: Object, default: defaultUserPreferences })
  preferences!: UserPreferences;

  @Prop({ type: Object, default: defaultUserSettings })
  settings!: UserSettings;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserModel);
