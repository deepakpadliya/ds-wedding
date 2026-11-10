import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { connect, ensureIndexes } from "./db.js";
import { seedAdmin } from "./auth.js";
import routes from "./routes.js";
import { HttpError } from "./validation.js";

for (const k of ["MONGO_URL", "DB_NAME", "JWT_SECRET"]) {
  if (!process.env[k]) throw new Error(`Missing required env var ${k} (see .env.example)`);
}

// Connect + seed once per process (also once per cold start on Vercel); retried if it failed.
let ready;
export const init = () => (ready ??= (async () => {
  await connect();
  await ensureIndexes();
  await seedAdmin();
})().catch((e) => { ready = undefined; throw e; }));

const apiErrors = (err, _req, res, _next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ detail: err.detail, ...err.extra });
  if (err.type === "entity.too.large") return res.status(413).json({ detail: "That file is too large (max 4 MB)" });
  if (err.type === "entity.parse.failed") return res.status(422).json({ detail: "Invalid JSON body" });
  console.error(err);
  res.status(500).json({ detail: "Internal Server Error" });
};

const app = express();
app.set("trust proxy", true);
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.set({ "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "strict-origin-when-cross-origin" });
  next();
});
app.use("/api", express.json({ limit: "100kb" }), cookieParser(),
  (_req, _res, next) => init().then(() => next(), next),
  routes,
  (_req, _res, next) => next(new HttpError(404, "Not Found")),
  apiErrors);

export default app;
