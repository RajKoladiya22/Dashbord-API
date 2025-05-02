"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTeamMember = void 0;
const database_config_1 = require("../../config/database.config");
const bcrypt_1 = __importDefault(require("bcrypt"));
const httpResponse_1 = require("../../core/utils/httpResponse");
const createTeamMember = async (req, res, next) => {
    const { full_name, email, password, department, position } = req.body;
    try {
        const teamMember = await database_config_1.prisma.$transaction(async (tx) => {
            var _a, _b, _c;
            if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
                (0, httpResponse_1.sendErrorResponse)(res, 403, "Only admins can create partners.");
                return;
            }
            const adminId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
            const [firstName, ...rest] = full_name.trim().split(" ");
            const lastName = rest.join(" ") || "";
            const exists = await tx.teamMember.findUnique({
                where: { email: email.toLowerCase() },
            });
            if (exists) {
                throw new Error("Email already in use.");
            }
            const saltRounds = parseInt((_c = process.env.SALT_ROUNDS) !== null && _c !== void 0 ? _c : "10", 10);
            const passwordHash = await bcrypt_1.default.hash(password, saltRounds);
            return tx.teamMember.create({
                data: {
                    adminId,
                    firstName,
                    lastName,
                    email: email.toLowerCase(),
                    passwordHash,
                    department,
                    position,
                    status: "active",
                    role: "team_member",
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    department: true,
                    position: true,
                    status: true,
                    createdAt: true,
                },
            });
        });
        (0, httpResponse_1.sendSuccessResponse)(res, 201, "Team member created", { teamMember });
    }
    catch (error) {
        console.error("createTeamMember error:", error);
        if (error.message === "Email already in use.") {
            (0, httpResponse_1.sendErrorResponse)(res, 409, error.message);
        }
        else {
            (0, httpResponse_1.sendErrorResponse)(res, 500, "Server error");
        }
        next(error);
    }
};
exports.createTeamMember = createTeamMember;
//# sourceMappingURL=teamAuth.controller.js.map