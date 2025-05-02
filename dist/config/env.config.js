"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envConfiguration = void 0;
const validate_env_1 = require("./validate-env");
const envConfiguration = () => ({
    nodeEnv: validate_env_1.validatedEnv.NODE_ENV,
    host: validate_env_1.validatedEnv.HOST,
    port: validate_env_1.validatedEnv.PORT,
    databaseUrl: validate_env_1.validatedEnv.DATABASE_URL,
    apikey: validate_env_1.validatedEnv.STATIC_TOKEN,
    saltRounds: validate_env_1.validatedEnv.SALT_ROUNDS,
    jwt: {
        secret: validate_env_1.validatedEnv.JWT_SECRET,
        expiresIn: validate_env_1.validatedEnv.JWT_EXPIRES_IN,
    },
});
exports.envConfiguration = envConfiguration;
//# sourceMappingURL=env.config.js.map