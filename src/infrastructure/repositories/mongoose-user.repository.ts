import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { FilterQuery, Model } from "mongoose";

import {
  createPaginationMeta,
  normalizePagination
} from "@/domain/common/pagination";
import {
  defaultUserPreferences,
  defaultUserSettings,
  type AdminUserListItem,
  type User
} from "@/domain/users/user.entity";
import type {
  CreateUserInput,
  UserListQuery,
  UserRepository
} from "@/domain/users/user.repository";
import { normalizeUserRole } from "@/domain/users/user-role.enum";
import {
  UserModel,
  type UserDocument
} from "@/infrastructure/database/schemas/user.schema";
import { escapeRegex, toObjectId } from "@/infrastructure/repositories/mongoose-utils";

@Injectable()
export class MongooseUserRepository implements UserRepository {
  constructor(
    @InjectModel(UserModel.name) private readonly userModel: Model<UserModel>
  ) {}

  async create(input: CreateUserInput): Promise<User> {
    const document = await this.userModel.create(input);
    return mapUser(document);
  }

  async findByEmail(email: string): Promise<User | null> {
    const document = await this.userModel.findOne({ email }).exec();
    return document ? mapUser(document) : null;
  }

  async findById(id: string): Promise<User | null> {
    const objectId = toObjectId(id);

    if (!objectId) {
      return null;
    }

    const document = await this.userModel.findById(objectId).exec();
    return document ? mapUser(document) : null;
  }

  async updatePreferences(
    id: string,
    preferences: User["preferences"]
  ): Promise<User | null> {
    const objectId = toObjectId(id);

    if (!objectId) {
      return null;
    }

    const document = await this.userModel
      .findByIdAndUpdate(objectId, { preferences }, { new: true })
      .exec();

    return document ? mapUser(document) : null;
  }

  async updateSettings(id: string, settings: User["settings"]): Promise<User | null> {
    const objectId = toObjectId(id);

    if (!objectId) {
      return null;
    }

    const document = await this.userModel
      .findByIdAndUpdate(objectId, { settings }, { new: true })
      .exec();

    return document ? mapUser(document) : null;
  }

  async listAdminUsers(query: UserListQuery) {
    const { page, pageSize, skip } = normalizePagination(query);
    const filter: FilterQuery<UserModel> = {};

    if (query.query?.trim()) {
      const regex = new RegExp(escapeRegex(query.query.trim()), "i");
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const [documents, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.userModel.countDocuments(filter).exec()
    ]);

    return {
      data: documents.map(mapAdminUser),
      pagination: createPaginationMeta(page, pageSize, total)
    };
  }
}

function mapUser(document: UserDocument): User {
  const object = document.toObject();

  return {
    id: object._id.toString(),
    name: object.name,
    email: object.email,
    passwordHash: object.passwordHash,
    role: normalizeUserRole(object.role),
    owner: object.owner ?? false,
    avatar: object.avatar,
    preferences: object.preferences ?? defaultUserPreferences,
    settings: object.settings ?? defaultUserSettings,
    createdAt: object.createdAt,
    updatedAt: object.updatedAt
  };
}

function mapAdminUser(document: UserDocument): AdminUserListItem {
  const user = mapUser(document);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.createdAt?.toISOString()
  };
}
