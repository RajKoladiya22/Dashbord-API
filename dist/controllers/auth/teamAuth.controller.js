"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTeamMember = void 0;
const database_config_1 = require("../../config/database.config");
const bcrypt_1 = __importDefault(require("bcrypt"));
const httpResponse_1 = require("../../core/utils/httpResponse");
const SALT_ROUNDS = parseInt((_a = database_config_1.env.SALT_ROUNDS) !== null && _a !== void 0 ? _a : "12", 10);
const createTeamMember = async (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
        (0, httpResponse_1.sendErrorResponse)(res, 403, "Only admins can create team members.");
        return;
    }
    const { firstName, email, password, department, position, role, } = req.body;
    if (!["team_member", "sub_admin"].includes(role)) {
        (0, httpResponse_1.sendErrorResponse)(res, 400, "Role must be 'team_member' or 'sub_admin'.");
        return;
    }
    try {
        const adminId = req.user.id;
        const [FN, ...rest] = firstName.trim().split(" ");
        const lastName = rest.join(" ") || "";
        const newMember = await database_config_1.prisma.$transaction(async (tx) => {
            const exists = await tx.teamMember.findUnique({
                where: { email: email.toLowerCase() },
            });
            if (exists) {
                throw new Error("Email already in use.");
            }
            const passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
            const member = await tx.teamMember.create({
                data: {
                    adminId,
                    firstName: FN,
                    lastName,
                    email: email.toLowerCase(),
                    passwordHash,
                    department,
                    position,
                    role,
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    department: true,
                    position: true,
                    role: true,
                    createdAt: true,
                },
            });
            await tx.loginCredential.create({
                data: {
                    role,
                    email: member.email,
                    passwordHash,
                    userProfileId: member.id,
                    adminId,
                },
            });
            return member;
        });
        (0, httpResponse_1.sendSuccessResponse)(res, 201, "Team member created successfully.", {
            teamMember: newMember,
        });
    }
    catch (err) {
        console.error("createTeamMember error:", err);
        if (err.message === "Email already in use.") {
            (0, httpResponse_1.sendErrorResponse)(res, 409, err.message);
        }
        else {
            (0, httpResponse_1.sendErrorResponse)(res, 500, "Server error");
        }
    }
};
exports.createTeamMember = createTeamMember;
//# sourceMappingURL=teamAuth.controller.js.map