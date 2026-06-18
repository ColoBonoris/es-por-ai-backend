import { Types } from "mongoose";

export function toObjectId(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }

  return new Types.ObjectId(id);
}

export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function createPublicId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
