"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envSchema = void 0;
const zod_1 = require("zod");
const toNumber = (val) => typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val))
    ? Number(val)
    : undefined;
exports.envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['local', 'development', 'production']),
    HOST: zod_1.z.string(),
    PORT: zod_1.z.preprocess(toNumber, zod_1.z.number().default(3000)),
    DATABASE_URL: zod_1.z.string().url(),
    DB_HOST: zod_1.z.string(),
    DB_PORT: zod_1.z.preprocess(toNumber, zod_1.z.number()),
    DB_USERNAME: zod_1.z.string(),
    DB_PASSWORD: zod_1.z.string(),
    DB_NAME: zod_1.z.string(),
    JWT_SECRET: zod_1.z.string(),
    JWT_EXPIRES_IN: zod_1.z.string(),
    SMTP_SERVICE: zod_1.z.string(),
    SMTP_HOST: zod_1.z.string(),
    SMTP_PORT: zod_1.z.preprocess(toNumber, zod_1.z.number()),
    SMTP_USER: zod_1.z.string(),
    SMTP_PASS: zod_1.z.string(),
    AWS_BUCKET_NAME: zod_1.z.string().optional(),
    AWS_REGION: zod_1.z.string().optional(),
    AWS_ACCESS_KEY_ID: zod_1.z.string().optional(),
    AWS_SECRET_ACCESS_KEY: zod_1.z.string().optional(),
    AWS_ENDPOINT: zod_1.z.string().optional(),
    CDN_ENDPOINT: zod_1.z.string().optional(),
    ADMIN_MAIL: zod_1.z.string().email(),
    STATIC_TOKEN: zod_1.z.string(),
    SALT_ROUNDS: zod_1.z.string()
});
//# sourceMappingURL=env.validation.js.map