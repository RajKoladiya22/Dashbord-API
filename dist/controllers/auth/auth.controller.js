"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.signIn = exports.signUpSuperAdmin = exports.signUpAdmin = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const date_fns_1 = require("date-fns");
const database_config_1 = require("../../config/database.config");
const httpResponse_1 = require("../../core/utils/httpResponse");
const jwt_token_1 = require("../../core/middleware/jwt/jwt.token");
const zod_1 = require("../../core/utils/zod");
const SALT_ROUNDS = parseInt((_a = database_config_1.env.SALT_ROUNDS) !== null && _a !== void 0 ? _a : "12", 10);
const signUpAdmin = async (req, res, next) => {
    const parsed = zod_1.signUpSchema.safeParse(req.body);
    if (!parsed.success) {
        (0, httpResponse_1.sendErrorResponse)(res, 400, "Invalid input", {
            errors: parsed.error.errors,
        });
        return;
    }
    const { firstName, lastName, email, password, contactNumber, companyName, address, } = parsed.data;
    try {
        const passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
        const admin = await database_config_1.prisma.$transaction(async (tx) => {
            const a = await tx.admin.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    passwordHash,
                    companyName,
                    contactInfo: { contactNumber },
                    address,
                    role: "admin",
                },
                select: {
                    id: true,
                    role: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                },
            });
            await tx.loginCredential.create({
                data: {
                    role: "admin",
                    email: a.email,
                    passwordHash,
                    userProfileId: a.id,
                    adminId: a.id,
                },
            });
            const plan = await tx.plan.findFirst({
                where: { name: "Basic", duration: "30 days" },
            });
            if (!plan)
                throw new Error("Default plan not found");
            const startsAt = new Date();
            const endsAt = (0, date_fns_1.addDays)(startsAt, 30);
            await tx.subscription.create({
                data: {
                    adminId: a.id,
                    planId: plan.id,
                    status: "active",
                    startsAt,
                    endsAt,
                },
            });
            return a;
        });
        const token = (0, jwt_token_1.generateToken)(admin.id, admin.role, admin.id);
        (0, jwt_token_1.setAuthCookie)(res, token);
        (0, httpResponse_1.sendSuccessResponse)(res, 201, "Admin account created", {
            token,
            user: {
                id: admin.id,
                email: admin.email,
                role: admin.role,
                firstName: admin.firstName,
                lastName: admin.lastName,
            },
        });
        return;
    }
    catch (err) {
        console.error("signUpAdmin error:", err);
        if (err.code === "P2002") {
            (0, httpResponse_1.sendErrorResponse)(res, 409, "Email already in use");
            return;
        }
        (0, httpResponse_1.sendErrorResponse)(res, 500, "Server error");
        return;
    }
};
exports.signUpAdmin = signUpAdmin;
const signUpSuperAdmin = async (req, res, next) => {
    const parsed = zod_1.signUpSuperAdminSchema.safeParse(req.body);
    if (!parsed.success) {
        (0, httpResponse_1.sendErrorResponse)(res, 400, "Invalid input", {
            errors: parsed.error.errors,
        });
        return;
    }
    const { firstName, lastName, email, password, contactNumber, address } = parsed.data;
    try {
        const passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
        const superAdmin = await database_config_1.prisma.$transaction(async (tx) => {
            const sa = await tx.superAdmin.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    passwordHash,
                    contactInfo: contactNumber ? { contactNumber } : undefined,
                    address,
                },
                select: { id: true, email: true },
            });
            await tx.loginCredential.create({
                data: {
                    role: "super_admin",
                    email: sa.email,
                    passwordHash,
                    userProfileId: sa.id,
                    superAdminId: sa.id,
                },
            });
            return sa;
        });
        const token = (0, jwt_token_1.generateToken)(superAdmin.id, "super_admin", superAdmin.id);
        (0, jwt_token_1.setAuthCookie)(res, token);
        (0, httpResponse_1.sendSuccessResponse)(res, 201, "Super‑admin registered", {
            token,
            user: { id: superAdmin.id, email: superAdmin.email, role: "super_admin" },
        });
        return;
    }
    catch (err) {
        console.error("registerSuperAdmin error:", err);
        if (err.code === "P2002") {
            (0, httpResponse_1.sendErrorResponse)(res, 409, "Email already in use");
            return;
        }
        (0, httpResponse_1.sendErrorResponse)(res, 500, "Server error");
        return;
    }
};
exports.signUpSuperAdmin = signUpSuperAdmin;
const signIn = async (req, res, next) => {
    const parsed = zod_1.signInSchema.safeParse(req.body);
    if (!parsed.success) {
        (0, httpResponse_1.sendErrorResponse)(res, 400, "Email and password are required");
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
        const dummyHash = "$2b$12$........................................";
        if (!cred) {
            await bcrypt_1.default.compare(password, dummyHash);
            (0, httpResponse_1.sendErrorResponse)(res, 401, "Invalid credentials");
            return;
        }
        const match = await bcrypt_1.default.compare(password, (cred === null || cred === void 0 ? void 0 : cred.passwordHash) || dummyHash);
        if (!cred || !match || cred.status !== true || !cred.userProfileId) {
            (0, httpResponse_1.sendErrorResponse)(res, 401, "Invalid credentials");
            return;
        }
        const now = new Date();
        if (cred.role !== "super_admin") {
            const sub = await database_config_1.prisma.subscription.findFirst({
                where: {
                    adminId: cred.adminId,
                    status: "active",
                    endsAt: { gt: now },
                },
                orderBy: { endsAt: "desc" },
            });
            if (!sub) {
                (0, httpResponse_1.sendErrorResponse)(res, 403, "No active subscription");
                return;
            }
        }
        let profile = null;
        switch (cred.role) {
            case "super_admin":
                profile = await database_config_1.prisma.superAdmin.findUnique({
                    where: { id: cred.userProfileId },
                    select: { id: true, firstName: true, lastName: true },
                });
                break;
            case "admin":
                profile = await database_config_1.prisma.admin.findUnique({
                    where: { id: cred.userProfileId },
                    select: { id: true, firstName: true, lastName: true, role: true },
                });
                break;
            case "partner":
                profile = await database_config_1.prisma.partner.findUnique({
                    where: { id: cred.userProfileId },
                    select: { id: true, firstName: true, lastName: true, role: true },
                });
                break;
            case "team_member":
                profile = await database_config_1.prisma.teamMember.findUnique({
                    where: { id: cred.userProfileId },
                    select: { id: true, firstName: true, lastName: true, role: true },
                });
                break;
            default:
                (0, httpResponse_1.sendErrorResponse)(res, 403, "Unsupported role");
                return;
        }
        if (!profile) {
            (0, httpResponse_1.sendErrorResponse)(res, 500, "User profile missing");
            return;
        }
        const token = (0, jwt_token_1.generateToken)(cred.userProfileId, cred.role, cred.adminId || cred.userProfileId);
        (0, jwt_token_1.setAuthCookie)(res, token);
        (0, httpResponse_1.sendSuccessResponse)(res, 200, "Logged in", {
            token,
            user: {
                id: profile.id,
                email,
                role: cred.role,
                firstName: profile.firstName,
                lastName: profile.lastName,
            },
        });
        return;
    }
    catch (err) {
        console.error("signIn error:", err);
        (0, httpResponse_1.sendErrorResponse)(res, 500, "Server error");
        return;
    }
};
exports.signIn = signIn;
//# sourceMappingURL=auth.controller.js.map