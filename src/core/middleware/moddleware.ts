import rateLimit from "express-rate-limit";
import helmet from "helmet";

// ── Global middleware (apply once in your app) ────────────────────────────────
export const securityMiddleware = [
  helmet(),  // secure headers :contentReference[oaicite:16]{index=16}
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 5,                   // limit each IP to 5 requests per windowMs :contentReference[oaicite:17]{index=17}
    message: "Too many attempts, please try again later."
  })
];