import { PrismaClient } from "@prisma/client";
// import { PrismaClient } from '../generated/client';
// import { validatedEnv } from "./validate-env";
import { config } from "dotenv";
config();

export const env = process.env;
APP_BASE_URL:env.APP_BASE_URL || "http://localhost:3000/api/v1"



// Ensure DATABASE_URL is defined
if (!env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

declare global {
  var __globalPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__globalPrisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["error"],
    datasources: { db: { url: env.DATABASE_URL } },
  });

if (env.NODE_ENV === "development") {
  global.__globalPrisma = prisma;
}

prisma
  .$connect()
  .then(() => console.log("✅ [Prisma] Database connected:", env.DATABASE_URL))
  .catch((err) => {
    console.error("❌ [Prisma] Database connection failed", err);
    process.exit(1);
  });

// prisma.$on("error", (e) => console.error("❌ [Prisma] Error event:", e));

export async function shutdownDb() {
  await prisma.$disconnect();
  console.log("🛑 [Prisma] Disconnected");
}

// Graceful shutdown
["SIGINT", "SIGTERM", "SIGUSR2"].forEach((sig) =>
  process.on(sig, () => shutdownDb().then(() => process.exit()))
);
process.on("unhandledRejection", () =>
  shutdownDb().then(() => process.exit(1))
);


