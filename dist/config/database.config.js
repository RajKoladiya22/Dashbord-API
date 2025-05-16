"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.env = void 0;
exports.shutdownDb = shutdownDb;
const client_1 = require("@prisma/client");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
exports.env = process.env;
if (!exports.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set");
    process.exit(1);
}
exports.prisma = (_a = global.__globalPrisma) !== null && _a !== void 0 ? _a : new client_1.PrismaClient({
    log: exports.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["error"],
    datasources: { db: { url: exports.env.DATABASE_URL } },
});
if (exports.env.NODE_ENV === "development") {
    global.__globalPrisma = exports.prisma;
}
exports.prisma
    .$connect()
    .then(() => console.log("✅ [Prisma] Database connected:", exports.env.DATABASE_URL))
    .catch((err) => {
    console.error("❌ [Prisma] Database connection failed", err);
    process.exit(1);
});
async function shutdownDb() {
    await exports.prisma.$disconnect();
    console.log("🛑 [Prisma] Disconnected");
}
["SIGINT", "SIGTERM", "SIGUSR2"].forEach((sig) => process.on(sig, () => shutdownDb().then(() => process.exit())));
process.on("unhandledRejection", () => shutdownDb().then(() => process.exit(1)));
//# sourceMappingURL=database.config.js.map