// Signert admin-session — Web Crypto (HMAC-SHA256) så det virker både i
// proxy (edge) og server actions (node). Ingen node-spesifikke API-er.

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return toHex(sig);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export const COOKIE = "vektra_admin";
const TTL = 60 * 60 * 24 * 7; // 7 dager

export async function createToken(secret: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + TTL;
  return `${exp}.${await hmac(secret, String(exp))}`;
}

export async function verifyToken(secret: string, token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [expStr, sig] = token.split(".");
  if (!expStr || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  return safeEqual(sig, await hmac(secret, expStr));
}

// Sammenlign passord via HMAC av begge — unngår lengde-/timing-lekkasje.
export async function verifyPassword(
  secret: string,
  expected: string,
  given: string,
): Promise<boolean> {
  return safeEqual(await hmac(secret, given), await hmac(secret, expected));
}
