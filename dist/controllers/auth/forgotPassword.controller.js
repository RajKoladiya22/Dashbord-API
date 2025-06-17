"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePassword = exports.forgotPassword = void 0;
const database_config_1 = require("../../config/database.config");
const httpResponse_1 = require("../../core/utils/httpResponse");
const crypto_1 = __importDefault(require("crypto"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const SALT_ROUNDS = parseInt((_a = database_config_1.env.SALT_ROUNDS) !== null && _a !== void 0 ? _a : "12", 10);
const mailtransport = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: "magicallydev@gmail.com",
        pass: "vkdd frwe seja frlb",
    },
});
const forgotPassword = async (req, res, next) => {
    const rawEmail = req.body.email;
    const email = rawEmail === null || rawEmail === void 0 ? void 0 : rawEmail.trim().toLowerCase();
    if (!email) {
        (0, httpResponse_1.sendErrorResponse)(res, 400, "Email is required");
        return;
    }
    try {
        const cred = await database_config_1.prisma.loginCredential.findUnique({
            where: { email, },
            select: { userProfileId: true, role: true, status: true },
        });
        if (!cred) {
            (0, httpResponse_1.sendErrorResponse)(res, 401, "Email is not found");
            return;
        }
        if (!cred.status) {
            (0, httpResponse_1.sendErrorResponse)(res, 401, "Your Account is not active yet!");
            return;
        }
        const otp = crypto_1.default.randomInt(100000, 999999).toString();
        await database_config_1.prisma.passwordOtp.create({
            data: {
                userId: cred.userProfileId,
                otp,
                purpose: "forgot_password",
                used: false,
            },
        });
        await mailtransport.sendMail({
            from: `"MagicallySoft" <magicallydev@gmail.com>`,
            to: email,
            subject: "Password Reset OTP",
            html: `
        <p>Hi,</p>
        <p>Your OTP for resetting the password is: <strong>${otp}</strong></p>
        <p>This OTP is valid for the next 15 minutes.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
        <br/>
        <p>Regards,<br/>MagicallySoft Team</p>
      `,
        });
        (0, httpResponse_1.sendSuccessResponse)(res, 200, "If that account exists, an OTP has been sent");
    }
    catch (err) {
        console.error("forgotPassword error:", err);
        (0, httpResponse_1.sendErrorResponse)(res, 500, "Server error");
    }
};
exports.forgotPassword = forgotPassword;
const UpdatePassword = async (req, res, next) => {
    var _a;
    const email = (_a = req.body.email) === null || _a === void 0 ? void 0 : _a.toLowerCase().trim();
    const { otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        (0, httpResponse_1.sendErrorResponse)(res, 400, "Email, OTP, and new password are required");
        return;
    }
    try {
        const cred = await database_config_1.prisma.loginCredential.findUnique({
            where: { email },
            select: {
                id: true,
                passwordHash: true,
                role: true,
                userProfileId: true,
            },
        });
        if (!cred) {
            (0, httpResponse_1.sendErrorResponse)(res, 400, "Invalid email or OTP");
            return;
        }
        const otpEntry = await database_config_1.prisma.passwordOtp.findFirst({
            where: {
                userId: cred.userProfileId,
                otp,
                purpose: "forgot_password",
                used: false,
                createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
            },
        });
        if (!otpEntry) {
            (0, httpResponse_1.sendErrorResponse)(res, 400, "Invalid or expired OTP");
            return;
        }
        const passwordHash = await bcrypt_1.default.hash(newPassword, SALT_ROUNDS);
        await database_config_1.prisma.$transaction(async (tx) => {
            await tx.loginCredential.update({
                where: { email },
                data: { passwordHash },
            });
            switch (cred.role) {
                case "super_admin":
                    await tx.superAdmin.update({
                        where: { id: cred.userProfileId },
                        data: { passwordHash },
                    });
                    break;
                case "admin":
                    await tx.admin.update({
                        where: { id: cred.userProfileId },
                        data: { passwordHash },
                    });
                    break;
                case "partner":
                    await tx.partner.update({
                        where: { id: cred.userProfileId },
                        data: { passwordHash },
                    });
                    break;
                case "team_member":
                case "sub_admin":
                    await tx.teamMember.update({
                        where: { id: cred.userProfileId },
                        data: { passwordHash },
                    });
                    break;
                default:
                    throw new Error("Unsupported role");
            }
            await tx.passwordOtp.update({
                where: { id: otpEntry.id },
                data: { used: true },
            });
        });
        (0, httpResponse_1.sendSuccessResponse)(res, 200, "Password reset successful");
    }
    catch (err) {
        console.error("resetPassword error:", err);
        (0, httpResponse_1.sendErrorResponse)(res, 500, "Server error");
    }
};
exports.UpdatePassword = UpdatePassword;
//# sourceMappingURL=forgotPassword.controller.js.map