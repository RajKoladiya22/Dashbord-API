"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envConfiguration = void 0;
const validate_env_1 = require("./validate-env");
const { NODE_ENV, HOST, PORT, DATABASE_URL, STATIC_TOKEN, SALT_ROUNDS, JWT_SECRET, JWT_EXPIRES_IN, } = validate_env_1.validatedEnv;
const envConfiguration = () => ({
    nodeEnv: NODE_ENV,
    host: HOST,
    port: PORT,
    databaseUrl: DATABASE_URL,
    apikey: STATIC_TOKEN,
    saltRounds: SALT_ROUNDS,
    jwt: { secret: JWT_SECRET, expiresIn: JWT_EXPIRES_IN },
});
exports.envConfiguration = envConfiguration;
//# sourceMappingURL=env.config.js.map