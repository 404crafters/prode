import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

const KEY_LENGTH = 64;
const COST = 16384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptPassword(password, salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELIZATION,
    maxmem: 64 * 1024 * 1024,
  });

  return [
    "scrypt",
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const [algorithm, cost, blockSize, parallelization, salt, storedKey] = passwordHash.split("$");

  if (algorithm !== "scrypt" || !cost || !blockSize || !parallelization || !salt || !storedKey) {
    return false;
  }

  const key = await scryptPassword(password, Buffer.from(salt, "base64url"), KEY_LENGTH, {
    N: Number(cost),
    r: Number(blockSize),
    p: Number(parallelization),
    maxmem: 64 * 1024 * 1024,
  });
  const stored = Buffer.from(storedKey, "base64url");

  return stored.length === key.length && timingSafeEqual(stored, key);
}

function scryptPassword(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}
