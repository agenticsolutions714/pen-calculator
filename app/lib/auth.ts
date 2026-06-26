export const AUTH_COOKIE = "pen-calc-auth";

function getSecret(): string {
  return process.env.AUTH_SECRET || process.env.APP_PASSWORD || "dev-insecure-secret";
}

function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let str = "";
  for (const b of arr) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(value: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return base64url(sig);
}

/** Create a signed token proving the user authenticated. */
export async function createToken(): Promise<string> {
  const payload = "authed";
  const sig = await hmac(payload);
  return `${payload}.${sig}`;
}

/** Verify a signed token using a constant-time comparison. */
export async function verifyToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (payload !== "authed" || !sig) return false;
  const expected = await hmac(payload);
  if (sig.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
