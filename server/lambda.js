// Serverless handler (same pattern as auth-service/src/lambda.ts):
// the Express app is never "listening"; Vercel calls this function per request and the
// app + MongoDB connection are cached between warm invocations.
import app, { init } from "./app.js";

export default async function handler(req, res) {
  try {
    await init(); // cached after the first (cold-start) call
    await new Promise((resolve) => {
      res.on("finish", resolve);
      res.on("close", resolve);
      app(req, res);
    });
  } catch (error) {
    console.error("Lambda init/handler error:", error);
    if (!res.headersSent) res.status(500).json({ error: "Internal server error", message: error.message });
  }
}
