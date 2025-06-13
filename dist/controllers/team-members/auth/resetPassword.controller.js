"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_config_1 = require("../../config/database.config");
const httpResponse_1 = require("../../core/utils/httpResponse");
const SALT_ROUNDS = parseInt((_a = database_config_1.env.SALT_ROUNDS) !== null && _a !== void 0 ? _a : "12", 10);
const resetPassword = async (req, res, next) => {
    const user = req.user;
    if (!user) {
        (0, httpResponse_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const userId = user.id;
    const adminId = user.role === "admin" ? user.id : user.adminId;
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        (0, httpResponse_1.sendErrorResponse)(res, 400, "Both oldPassword and newPassword are required");
        return;
    }
    try {
        const credential = await database_config_1.prisma.loginCredential.findFirst({
            where: {
                userProfileId: userId,
                ...(user.role !== 'super_admin' && { adminId }),
                status: true
            },
        });
        if (!credential || !credential.passwordHash) {
            (0, httpResponse_1.sendErrorResponse)(res, 404, "Credential not found");
            return;
        }
        const isMatch = await bcrypt_1.default.compare(oldPassword, credential.passwordHash);
        if (!isMatch) {
            (0, httpResponse_1.sendErrorResponse)(res, 400, "Incorrect old password");
            return;
        }
        const passwordHash = await bcrypt_1.default.hash(newPassword, SALT_ROUNDS);
        await database_config_1.prisma.$transaction(async (tx) => {
            await tx.loginCredential.updateMany({
                where: {
                    userProfileId: userId,
                    ...(user.role !== 'super_admin' && { adminId }),
                },
                data: { passwordHash },
            });
            switch (user.role) {
                case "super_admin":
                    await tx.superAdmin.update({
                        where: { id: userId },
                        data: { passwordHash },
                    });
                    break;
                case "admin":
                    await tx.admin.update({
                        where: { id: userId },
                        data: { passwordHash },
                    });
                    break;
                case "partner":
                    await tx.partner.update({
                        where: { id: userId, adminId },
                        data: { passwordHash },
                    });
                    break;
                case "team_member":
                case "sub_admin":
                    await tx.teamMember.update({
                        where: { id: userId, adminId },
                        data: { passwordHash },
                    });
                    break;
                default:
                    throw new Error("Unsupported role");
            }
        });
        (0, httpResponse_1.sendSuccessResponse)(res, 200, "Password updated successfully");
    }
    catch (err) {
        console.error("resetPassword error:", err);
        (0, httpResponse_1.sendErrorResponse)(res, 500, "Server error");
    }
};
exports.resetPassword = resetPassword;
//# sourceMappingURL=resetPassword.controller.js.map