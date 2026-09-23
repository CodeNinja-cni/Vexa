import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const ENVELOPE_VERSION = "v1";

function encode(value: Buffer): string {
  return value.toString("base64url");
}

function decode(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

function deriveKey(secret: string, purpose: string): Buffer {
  if (secret.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  }

  return createHash("sha256")
    .update(`vexa:${purpose}:${secret}`, "utf8")
    .digest();
}

export function generateOpaqueToken(bytes = 32): string {
  return encode(randomBytes(bytes));
}

export function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function secureEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function sealJson<T>(
  value: T,
  secret: string,
  purpose: string,
): string {
  const key = deriveKey(secret, purpose);
  const initializationVector = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, initializationVector);
  cipher.setAAD(Buffer.from(purpose, "utf8"));

  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authenticationTag = cipher.getAuthTag();

  return [
    ENVELOPE_VERSION,
    encode(initializationVector),
    encode(authenticationTag),
    encode(ciphertext),
  ].join(".");
}

export function openJson<T>(
  envelope: string,
  secret: string,
  purpose: string,
): T {
  const [version, encodedIv, encodedTag, encodedCiphertext, extra] =
    envelope.split(".");

  if (
    version !== ENVELOPE_VERSION ||
    !encodedIv ||
    !encodedTag ||
    !encodedCiphertext ||
    extra
  ) {
    throw new Error("The encrypted value has an unsupported format.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    deriveKey(secret, purpose),
    decode(encodedIv),
  );
  decipher.setAAD(Buffer.from(purpose, "utf8"));
  decipher.setAuthTag(decode(encodedTag));

  const plaintext = Buffer.concat([
    decipher.update(decode(encodedCiphertext)),
    decipher.final(),
  ]);

  return JSON.parse(plaintext.toString("utf8")) as T;
}
