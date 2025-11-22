import crypto from "crypto";

const ALG = "HS256";
const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

const base64url = (input) =>
  Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const fromBase64url = (input) => {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
};

export function signJWT(payload, expiresInSeconds = process.env.EXPIRY_LIMIT_DAYS * 24*60) {
  const header = { alg: ALG, typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const body = { ...payload, exp };
  const data = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(body))}`;
  const signature = crypto.createHmac("sha256", SECRET).update(data).digest();
  return `${data}.${base64url(signature)}`;
}

export function verifyJWT(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [rawHeader, rawPayload, rawSig] = parts;
  const data = `${rawHeader}.${rawPayload}`;
  const expectedSig = base64url(crypto.createHmac("sha256", SECRET).update(data).digest());
  if (expectedSig.length !== rawSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(rawSig))) return null;

  try {
    const payload = JSON.parse(fromBase64url(rawPayload));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch (err) {
    return null;
  }
}

export function authCookie(token) {
  const isProd = process.env.NODE_ENV === "production";
  return [
    `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`,
    isProd ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearAuthCookie() {
  return "token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax";
}
