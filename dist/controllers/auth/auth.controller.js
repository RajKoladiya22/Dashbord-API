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
        (0, httpResponse_1.sendErrorResponse)(res, 400, "Email and password are required");
        return;
    }
    const { identifier: email, password } = parsed.data;
    try {
        const now = new Date();
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
        const dummyHash = "$2b$12$........................................";
        const match = await bcrypt_1.default.compare(password, (cred === null || cred === void 0 ? void 0 : cred.passwordHash) || dummyHash);
        if (!cred || !match || cred.status !== "active" || !cred.adminId) {
            (0, httpResponse_1.sendErrorResponse)(res, 401, "Invalid credentials");
            return;
        }
        const [subscription, userProfile] = await Promise.all([
            database_config_1.prisma.subscription.findFirst({
                where: {
                    adminId: cred.adminId,
                    status: "active",
                    endsAt: { gt: now },
                },
                select: { id: true },
                orderBy: { endsAt: "desc" },
            }),
            (async () => {
                if (cred.role === "admin") {
                    return database_config_1.prisma.admin.findUnique({
                        where: { id: cred.userProfileId },
                        select: { id: true, firstName: true, lastName: true, role: true },
                    });
                }
                else if (cred.role === "partner") {
                    return database_config_1.prisma.partner.findUnique({
                        where: { id: cred.userProfileId },
                        select: { id: true, firstName: true, lastName: true, role: true },
                    });
                }
                else {
                    return database_config_1.prisma.teamMember.findUnique({
                        where: { id: cred.userProfileId },
                        select: { id: true, firstName: true, lastName: true, role: true },
                    });
                }
            })(),
        ]);
        if (!subscription) {
            (0, httpResponse_1.sendErrorResponse)(res, 403, "No active subscription");
            return;
        }
        if (!userProfile) {
            (0, httpResponse_1.sendErrorResponse)(res, 500, "User profile missing");
            return;
        }
        const token = (0, jwt_token_1.generateToken)(cred.userProfileId, cred.role, cred.adminId);
        (0, jwt_token_1.setAuthCookie)(res, token);
        (0, httpResponse_1.sendSuccessResponse)(res, 200, "Logged in", {
            token,
            user: {
                id: userProfile.id,
                email,
                role: userProfile.role,
                firstName: userProfile.firstName,
                lastName: userProfile.lastName,
            },
        });
        return;
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
    const { firstName, lastName, email, password, contactNumber, companyName, address, } = parsed.data;
    try {
        const hashed = await bcrypt_1.default.hash(password, SALT_ROUNDS);
        const result = await database_config_1.prisma.$transaction(async (tx) => {
            const admin = await tx.admin.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    passwordHash: hashed,
                    companyName,
                    contactInfo: { contactNumber },
                    address,
                    status: "active",
                    role: "admin",
                },
                select: { id: true, role: true, email: true },
            });
            await tx.subscription.create({
                data: {
                    adminId: admin.id,
                    planId: "5987d07c-bbe5-4f93-b87a-bb8907b36244",
                    status: "active",
                    startsAt: new Date(),
                    endsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
                },
            });
            return admin;
        });
        const token = (0, jwt_token_1.generateToken)(result.id, result.role, result.id);
        (0, jwt_token_1.setAuthCookie)(res, token);
        (0, httpResponse_1.sendSuccessResponse)(res, 201, "Account created", {
            token,
            user: { id: result.id, email: result.email, role: result.role },
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