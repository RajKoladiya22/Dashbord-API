"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgotPassword = void 0;
const database_config_1 = require("../../config/database.config");
const httpResponse_1 = require("../../core/utils/httpResponse");
const crypto_1 = __importDefault(require("crypto"));
const forgotPassword = async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        (0, httpResponse_1.sendErrorResponse)(res, 400, "Email is required");
        return;
    }
    try {
        const cred = await database_config_1.prisma.loginCredential.findUnique({
            where: { email: email.toLowerCase(), status: true },
            select: { userProfileId: true, role: true }
        });
        if (!cred) {
            (0, httpResponse_1.sendSuccessResponse)(res, 200, "If that account exists, an OTP has been sent");
            return;
        }
        const otp = crypto_1.default.randomInt(100000, 999999).toString();
        await database_config_1.prisma.passwordOtp.create({
            data: {
                userId: cred.userProfileId,
                otp,
                purpose: "forgot_password",
                used: false,
            }
        });
        (0, httpResponse_1.sendSuccessResponse)(res, 200, "If that account exists, an OTP has been sent");
    }
    catch (err) {
        console.error("forgotPassword error:", err);
        (0, httpResponse_1.sendErrorResponse)(res, 500, "Server error");
    }
};
exports.forgotPassword = forgotPassword;
//# sourceMappingURL=forgotPassword.controller.js.map