// src/server.ts
import { envConfiguration } from './config/env.config';
import { validatedEnv } from './config/validate-env';
import app from './app';
import { shutdownDb } from './config/database.config';
import { logger } from './core/middleware/logs/logger';

envConfiguration();
const env = validatedEnv;

// console.log(env);


const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Server listening on http://localhost:${env.PORT} - [${env.NODE_ENV}]`);
});

import { prisma } from "./config/database.config";

// console.log("Prisma---->", prisma.loginCredential.create);


// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('SIGINT received: closing HTTP server');
  server.close(async () => {
    await shutdownDb();
    logger.info('Database disconnected, exiting.');
    process.exit(0);
  });
});
process.on('SIGTERM', () => process.exit(0));
