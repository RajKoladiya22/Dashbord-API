// src/core/middleware/checkStaticToken.ts
import { Request, Response, NextFunction } from "express";
import { validatedEnv } from "../../../config/validate-env";
import { sendErrorResponse } from "../../utils/responseHandler";

export const checkStaticToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const incoming = req.header("x-api-key") || req.header("authorization");      // get token header
    const expected = validatedEnv.STATIC_TOKEN;                                    // expected static token

    // 1) Missing token?
    if (!incoming) {
      sendErrorResponse(res, 401, "Missing API Key");                             // respond 401
      return;                                                                      // <— must return here to stop execution :contentReference[oaicite:3]{index=3}
    }

    // 2) Normalize Bearer header
    const token = incoming.startsWith("Bearer ")
      ? incoming.slice(7).trim()
      : incoming;

    // 3) Invalid token?
    if (token !== expected) {
      sendErrorResponse(res, 403, "Invalid API Key");                             // respond 403
      return;                                                                      // <— must return here :contentReference[oaicite:4]{index=4}
    }

    // 4) All good—proceed
    next();                                                                        // pass control to next middleware/router :contentReference[oaicite:5]{index=5}

  } catch (err) {
    // Unexpected error—log and forward to your global error handler
    console.error("checkStaticToken error:", err);
    next(err as Error);                                                            // Express will catch this in your errorHandler middleware :contentReference[oaicite:6]{index=6}
  }
};
