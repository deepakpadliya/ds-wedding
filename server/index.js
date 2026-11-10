import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import app, { init } from "./app.js";
import { close } from "./db.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isProd = process.env.NODE_ENV === "production";
const PORT = Number(process.env.PORT) || 3000;
const server = http.createServer(app);

if (isProd) {
  const dist = path.join(root, "dist");
  app.use(express.static(dist, { index: false, maxAge: "1h" }));
  app.use((_req, res) => res.sendFile(path.join(dist, "index.html")));
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({ root, server: { middlewareMode: true, hmr: { server } }, appType: "spa" });
  app.use(vite.middlewares);
}

await init();
server.listen(PORT, () => console.log(`Wedding app (${isProd ? "production" : "dev"}) on http://localhost:${PORT}`));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => server.close(async () => { await close(); process.exit(0); }));
