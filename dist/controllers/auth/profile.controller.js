"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_config_1 = require("../../config/database.config");
const httpResponse_1 = require("../../core/utils/httpResponse");
const SALT_ROUNDS = parseInt((_a = database_config_1.env.SALT_ROUNDS) !== null && _a !== void 0 ? _a : "12", 10);
const getProfile = async (req, res, next) => {
    const user = req.user;
    if (!user) {
        (0, httpResponse_1.sendErrorResponse)(res, 401, 'Unauthorized');
        return;
    }
    try {
        let profile;
        switch (user.role) {
            case 'super_admin':
                profile = await database_config_1.prisma.superAdmin.findUnique({
                    where: { id: user.id },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        contactInfo: true,
                        address: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                });
                break;
            case 'admin':
                profile = await database_config_1.prisma.admin.findUnique({
                    where: { id: user.id },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        contactInfo: true,
                        address: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                });
                break;
            case 'partner':
                profile = await database_config_1.prisma.partner.findUnique({
                    where: { id: user.id },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        contactInfo: true,
                        address: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                });
                break;
            case 'team_member':
            case 'sub_admin':
                profile = await database_config_1.prisma.teamMember.findUnique({
                    where: { id: user.id },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        contactInfo: true,
                        address: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                });
                break;
            default:
                (0, httpResponse_1.sendErrorResponse)(res, 400, 'Invalid user role');
                return;
        }
        if (!profile) {
            (0, httpResponse_1.sendErrorResponse)(res, 404, 'Profile not found');
            return;
        }
        (0, httpResponse_1.sendSuccessResponse)(res, 200, 'Profile retrieved successfully', { profile });
    }
    catch (err) {
        console.error('getProfile error:', err);
        (0, httpResponse_1.sendErrorResponse)(res, 500, 'Server error');
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res, next) => {
    const user = req.user;
    if (!user) {
        (0, httpResponse_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const adminId = user.role === "admin" ? user.id : user.adminId;
    const { firstName, lastName, email, password, contactInfo, address } = req.body;
    try {
        let passwordHash;
        if (password) {
            passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
        }
        const updateData = {
            ...(firstName !== undefined && { firstName }),
            ...(lastName !== undefined && { lastName }),
            ...(contactInfo !== undefined && { contactInfo }),
            ...(address !== undefined && { address }),
        };
        const result = await database_config_1.prisma.$transaction(async (tx) => {
            let updatedProfile;
            switch (user.role) {
                case "super_admin":
                    updatedProfile = await tx.superAdmin.update({
                        where: { id: user.id },
                        data: {
                            ...updateData,
                            ...(email && { email }),
                            ...(passwordHash && { passwordHash }),
                        },
                    });
                    break;
                case "admin":
                    updatedProfile = await tx.admin.update({
                        where: { id: user.id },
                        data: {
                            ...updateData,
                            ...(email && { email }),
                            ...(passwordHash && { passwordHash }),
                        },
                    });
                    break;
                case "partner":
                    updatedProfile = await tx.partner.update({
                        where: { id: user.id, status: true },
                        data: {
                            ...updateData,
                            ...(email && { email }),
                            ...(passwordHash && { passwordHash }),
                        },
                    });
                    break;
                case "team_member":
                case "sub_admin":
                    updatedProfile = await tx.teamMember.update({
                        where: { id: user.id, status: true },
                        data: {
                            ...updateData,
                            ...(email && { email }),
                            ...(passwordHash && { passwordHash }),
                        },
                    });
                    break;
                default:
                    throw new Error("Unsupported role");
            }
            if (email || passwordHash) {
                const cred = await tx.loginCredential.findFirst({
                    where: { userProfileId: user.id, adminId },
                    select: { id: true },
                });
                if (cred) {
                    await tx.loginCredential.update({
                        where: { id: cred.id },
                        data: { ...(email && { email }), ...(passwordHash && { passwordHash }) },
                    });
                }
            }
            return updatedProfile;
        });
        (0, httpResponse_1.sendSuccessResponse)(res, 200, "Profile updated", { data: result });
    }
    catch (err) {
        console.error("updateProfile error:", err);
        (0, httpResponse_1.sendErrorResponse)(res, err.code === "P2002" ? 409 : 500, err.message || "Server error");
    }
};
exports.updateProfile = updateProfile;
//# sourceMappingURL=profile.controller.js.map