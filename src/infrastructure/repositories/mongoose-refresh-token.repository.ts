import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";

import type { RefreshToken } from "@/domain/auth/refresh-token.entity";
import type {
  CreateRefreshTokenInput,
  RefreshTokenRepository
} from "@/domain/auth/refresh-token.repository";
import {
  RefreshTokenModel,
  type RefreshTokenDocument
} from "@/infrastructure/database/schemas/refresh-token.schema";
import { toObjectId } from "@/infrastructure/repositories/mongoose-utils";

@Injectable()
export class MongooseRefreshTokenRepository implements RefreshTokenRepository {
  constructor(
    @InjectModel(RefreshTokenModel.name)
    private readonly refreshTokenModel: Model<RefreshTokenModel>
  ) {}

  async create(input: CreateRefreshTokenInput): Promise<RefreshToken> {
    const userId = toObjectId(input.userId);

    if (!userId) {
      throw new Error("Invalid user id.");
    }

    const document = await this.refreshTokenModel.create({
      ...input,
      userId
    });

    return mapRefreshToken(document);
  }

  async findActiveByHash(tokenHash: string, now: Date): Promise<RefreshToken | null> {
    const document = await this.refreshTokenModel
      .findOne({
        tokenHash,
        revokedAt: null,
        expiresAt: { $gt: now }
      })
      .exec();

    return document ? mapRefreshToken(document) : null;
  }

  async revokeByHash(tokenHash: string, revokedAt: Date) {
    await this.refreshTokenModel
      .updateOne(
        { tokenHash, revokedAt: null },
        {
          revokedAt
        }
      )
      .exec();
  }

  async revokeAllForUser(userId: string, revokedAt: Date) {
    const objectId = toObjectId(userId);

    if (!objectId) {
      return;
    }

    await this.refreshTokenModel
      .updateMany({ userId: objectId, revokedAt: null }, { revokedAt })
      .exec();
  }
}

function mapRefreshToken(document: RefreshTokenDocument): RefreshToken {
  const object = document.toObject();

  return {
    id: object._id.toString(),
    userId: object.userId.toString(),
    tokenHash: object.tokenHash,
    expiresAt: object.expiresAt,
    revokedAt: object.revokedAt,
    createdAt: object.createdAt
  };
}
