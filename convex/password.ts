// Lightweight bearer-token session auth.
//
// Convex Auth is intentionally avoided here: this app only needs
// email + password with server-side sessions, and rolling it by hand keeps
// the dependency surface small and fully typed.

export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

/** SHA-256 hex digest, available in both the query and action runtimes. */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Random hex token. Uses Web Crypto so it works in any Convex runtime. */
export function randomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const PBKDF2_ITERATIONS = 100_000;

/** Salted PBKDF2-SHA256 password hash: `pbkdf2$<saltHex>$<hashHex>`. */
export async function hashPassword(password: string): Promise<string> {
  const saltHex = randomToken(16);
  const salt = new Uint8Array(
    saltHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)),
  );
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    256,
  );
  const hashHex = Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `pbkdf2$${saltHex}$${hashHex}`;
}

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time-ish verification of a stored hash against a password. */
export async function verifyPassword(
  stored: string,
  password: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "pbkdf2") return false;
  const [, saltHex, expectedHex] = parts;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const salt = new Uint8Array(
    saltHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)),
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    256,
  );
  const actualHex = toHex(bits);
  if (actualHex.length !== expectedHex.length) return false;
  let diff = 0;
  for (let i = 0; i < actualHex.length; i++) {
    diff |= actualHex.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  }
  return diff === 0;
}
