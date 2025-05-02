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
(0, env_config_1.envConfiguration)();
const env = validate_env_1.validatedEnv;
const server = app_1.default.listen(env.PORT, () => {
    logger_1.logger.info(`🚀 Server listening on http://localhost:${env.PORT} - [${env.NODE_ENV}]`);
});
process.on('SIGINT', async () => {
    logger_1.logger.info('SIGINT received: closing HTTP server');
    server.close(async () => {
        await (0, database_config_1.shutdownDb)();
        logger_1.logger.info('Database disconnected, exiting.');
        process.exit(0);
    });
});
process.on('SIGTERM', () => process.exit(0));
//# sourceMappingURL=server.js.map