// src/server.ts
import { envConfiguration } from "./config/env.config";
import { validatedEnv } from "./config/validate-env";
import app from "./app";
import { shutdownDb } from "./config/database.config";
import { logger } from "./core/middleware/logs/logger";
import { sendSuccessResponse } from "./core/utils/httpResponse";

envConfiguration();
const env = validatedEnv;

// console.log(env);

app.use("/", (req, res) => {
  sendSuccessResponse(res, 200, "Base route is working", {
    timestamp: new Date(),
  });
});

const server = app.listen(env.PORT, () => {
  logger.info(
    `🚀 Server listening on http://localhost:${env.PORT} - [${env.NODE_ENV}]`
  );
});

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("SIGINT received: closing HTTP server");
  server.close(async () => {
    await shutdownDb();
    logger.info("Database disconnected, exiting.");
    process.exit(0);
  });
});
process.on("SIGTERM", () => process.exit(0));
