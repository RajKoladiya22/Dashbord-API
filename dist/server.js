"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_config_1 = require("./config/env.config");
const validate_env_1 = require("./config/validate-env");
const app_1 = __importDefault(require("./app"));
const database_config_1 = require("./config/database.config");
const logger_1 = require("./core/middleware/logs/logger");
const httpResponse_1 = require("./core/utils/httpResponse");
const http_1 = __importDefault(require("http"));
const socket_1 = require("./socket.io/socket");
(0, env_config_1.envConfiguration)();
const env = validate_env_1.validatedEnv;
app_1.default.use("/", (req, res) => {
    (0, httpResponse_1.sendSuccessResponse)(res, 200, "Base route is working", {
        timestamp: new Date(),
    });
});
const httpServer = http_1.default.createServer(app_1.default);
(0, socket_1.initSocket)(httpServer);
httpServer.listen(env.PORT, () => {
    logger_1.logger.info(`🚀 Server listening on http://localhost:${env.PORT} - [${env.NODE_ENV}]`);
});
process.on("SIGINT", async () => {
    logger_1.logger.info("SIGINT received: closing HTTP server");
    httpServer.close(async () => {
        await (0, database_config_1.shutdownDb)();
        logger_1.logger.info("Database disconnected, exiting.");
        process.exit(0);
    });
});
process.on("SIGTERM", () => process.exit(0));
//# sourceMappingURL=server.js.map