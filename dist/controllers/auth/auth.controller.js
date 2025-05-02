"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.signUp = exports.signIn = void 0;
const database_config_1 = require("../../config/database.config");
const bcrypt_1 = __importDefault(require("bcrypt"));
const httpResponse_1 = require("../../core/utils/httpResponse");
const jwt_token_1 = require("../../core/middleware/jwt/jwt.token");
const zod_1 = require("../../core/utils/zod");
const SALT_ROUNDS = parseInt((_a = database_config_1.env.SALT_ROUNDS) !== null && _a !== void 0 ? _a : "12", 10);
const signIn = async (req, res, next) => {
    const parsed = zod_1.signInSchema.safeParse(req.body);
    if (!parsed.success) {
        (0, httpResponse_1.sendErrorResponse)(res, 400, "Invalid input");
        return;
    }
    const { identifier: email, password } = parsed.data;
    try {
        const cred = await database_config_1.prisma.loginCredential.findUnique({
            where: { email },
            select: {
                passwordHash: true,
                role: true,
                adminId: true,
                userProfileId: true,
                status: true,
            },
        });
        if (!cred || cred.status !== "active" || !cred.adminId) {
            (0, httpResponse_1.sendErrorResponse)(res, 401, "Invalid credentials");
            return;
        }
        const match = await bcrypt_1.default.compare(password, cred.passwordHash);
        if (!match) {
            (0, httpResponse_1.sendErrorResponse)(res, 401, "Invalid credentials");
            return;
        }
        const subscription = await database_config_1.prisma.subscription.findFirst({
            where: {
                adminId: cred.adminId,
                status: "active",
                endsAt: { gt: new Date() },
            },
            orderBy: { endsAt: "desc" },
            select: { id: true },
        });
        if (!subscription) {
            (0, httpResponse_1.sendErrorResponse)(res, 403, "No active subscription");
            return;
        }
        const admin = await database_config_1.prisma.admin.findUnique({
            where: { id: cred.adminId },
            select: { id: true, firstName: true, role: true, lastName: true },
        });
        if (!admin) {
            (0, httpResponse_1.sendErrorResponse)(res, 500, "Admin record missing");
            return;
        }
        const token = (0, jwt_token_1.generateToken)(cred.userProfileId, cred.role, cred.adminId);
        (0, jwt_token_1.setAuthCookie)(res, token);
        (0, httpResponse_1.sendSuccessResponse)(res, 200, "Logged in", {
            token,
            user: {
                id: admin.id,
                email,
                role: admin.role,
                username: admin.firstName,
                firstName: admin.firstName,
                lastName: admin.lastName
            },
        });
    }
    catch (err) {
        console.error("Login Error:", err);
        (0, httpResponse_1.sendErrorResponse)(res, 500, "Server error");
        next(err);
    }
};
exports.signIn = signIn;
const signUp = async (req, res, next) => {
    const parsed = zod_1.signUpSchema.safeParse(req.body);
    if (!parsed.success) {
        (0, httpResponse_1.sendErrorResponse)(res, 400, "Invalid input");
        return;
    }
    const { firstName, lastName, email, password, contactNumber, companyName, address } = parsed.data;
    try {
        const hashed = await bcrypt_1.default.hash(password, SALT_ROUNDS);
        const result = await database_config_1.prisma.$transaction(async (tx) => {
            const admin = await tx.admin.create({
                data: {
                    firstName, lastName, email,
                    passwordHash: hashed,
                    companyName,
                    contactInfo: { contactNumber },
                    address,
                    status: "active", role: "admin"
                },
                select: { id: true, role: true, email: true }
            });
            await tx.subscription.create({
                data: {
                    adminId: admin.id,
                    planId: "41cf83f7-2d28-430a-82ac-813d0a489aab",
                    status: "active",
                    startsAt: new Date(),
                    endsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000)
                }
            });
            return admin;
        });
        const token = (0, jwt_token_1.generateToken)(result.id, result.role, result.id);
        (0, jwt_token_1.setAuthCookie)(res, token);
        (0, httpResponse_1.sendSuccessResponse)(res, 201, "Account created", {
            token,
            user: { id: result.id, email: result.email, role: result.role }
        });
    }
    catch (err) {
        console.error("Sign-up Error:", err);
        (0, httpResponse_1.sendErrorResponse)(res, 500, "Server error");
        next(err);
    }
};
exports.signUp = signUp;
//# sourceMappingURL=auth.controller.js.map