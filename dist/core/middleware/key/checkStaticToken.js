"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkStaticToken = void 0;
const validate_env_1 = require("../../../config/validate-env");
const responseHandler_1 = require("../../utils/responseHandler");
const checkStaticToken = (req, res, next) => {
    try {
        const incoming = req.header("x-api-key") || req.header("authorization");
        const expected = validate_env_1.validatedEnv.STATIC_TOKEN;
        if (!incoming) {
            (0, responseHandler_1.sendErrorResponse)(res, 401, "Missing API Key");
            return;
        }
        const token = incoming.startsWith("Bearer ")
            ? incoming.slice(7).trim()
            : incoming;
        if (token !== expected) {
            (0, responseHandler_1.sendErrorResponse)(res, 403, "Invalid API Key");
            return;
        }
        next();
    }
    catch (err) {
        console.error("checkStaticToken error:", err);
        next(err);
    }
};
exports.checkStaticToken = checkStaticToken;
//# sourceMappingURL=checkStaticToken.js.map