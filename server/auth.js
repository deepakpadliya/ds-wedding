import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db.js";
import { HttpError } from "./validation.js";

const SECRET = process.env.JWT_SECRET;
const ttl = (v) => {
  const m = /^\s*(\d+)\s*([smhd]?)\s*$/.exec(v || "1d");
  return m ? Number(m[1]) * { "": 1, s: 1, m: 60, h: 3600, d: 86400 }[m[2]] : 86400;
};
const ACCESS_TTL = ttl(process.env.JWT_EXPIRES_IN);
const REFRESH_TTL = 7 * 86400;
const SECURE = process.env.COOKIE_SECURE === "true";
const cookieOpts = (maxAge) => ({ httpOnly: true, secure: SECURE, sameSite: "lax", maxAge: maxAge * 1000, path: "/" });

export const hashPassword = (p) => bcrypt.hash(p, 12);
export const verifyPassword = (p, h) => bcrypt.compare(p, h || "");

const token = (sub, type, seconds) => jwt.sign({ sub, type }, SECRET, { algorithm: "HS256", expiresIn: seconds });

export function setAuthCookies(res, adminId) {
  const access = token(adminId, "access", ACCESS_TTL);
  res.cookie("access_token", access, cookieOpts(ACCESS_TTL));
  res.cookie("refresh_token", token(adminId, "refresh", REFRESH_TTL), cookieOpts(REFRESH_TTL));
  return access;
}
export function clearAuthCookies(res) {
  for (const n of ["access_token", "refresh_token"]) res.clearCookie(n, cookieOpts(0));
}

function decode(tok, type, typeMsg) {
  try {
    const p = jwt.verify(tok, SECRET, { algorithms: ["HS256"] });
    if (p.type !== type) throw new HttpError(401, typeMsg);
    return p;
  } catch (e) {
    if (e instanceof HttpError) throw e;
    if (e.name === "TokenExpiredError") throw new HttpError(401, "Session expired, please log in again");
    throw new HttpError(401, "Invalid session");
  }
}

export async function activeAdmin(sub) {
  const admin = await db.collection("admin_users").findOne({ id: sub }, { projection: { _id: 0, passwordHash: 0 } });
  if (!admin || admin.isActive === false) throw new HttpError(401, "Admin account unavailable");
  return admin;
}

export async function requireAdmin(req, _res, next) {
  try {
    let tok = req.cookies?.access_token;
    const h = req.headers.authorization || "";
    if (!tok && h.startsWith("Bearer ")) tok = h.slice(7);
    if (!tok) throw new HttpError(401, "Not authenticated");
    req.admin = await activeAdmin(decode(tok, "access", "Invalid token type").sub);
    next();
  } catch (e) { next(e); }
}

export const decodeRefresh = (tok) => decode(tok, "refresh", "Invalid refresh token");

export async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const users = db.collection("admin_users");
  if (await users.findOne({ email })) return;
  const now = new Date();
  await users.insertOne({
    id: crypto.randomUUID(), email, passwordHash: await hashPassword(process.env.ADMIN_PASSWORD || "admin123"),
    role: "admin", isActive: true, lastLoginAt: null, createdAt: now, updatedAt: now,
  });
  console.log(`Initial admin user seeded for ${email}`);
}
