"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatedEnv = void 0;
const dotenv_1 = require("dotenv");
const env_validation_1 = require("./env.validation");
(0, dotenv_1.config)({ path: `.env.${process.env.NODE_ENV || 'local'}` });
const parsed = env_validation_1.envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    parsed.error.issues.forEach((issue) => {
        console.error(`  • ${issue.path.join('.')} — ${issue.message}`);
    });
    process.exit(1);
}
exports.validatedEnv = parsed.data;
//# sourceMappingURL=validate-env.js.map