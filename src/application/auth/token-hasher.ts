import { createHash } from "crypto";

export function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
