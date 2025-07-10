"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTeamMemberStatus = exports.listTeamMembers = void 0;
const database_config_1 = require("../../config/database.config");
const httpResponse_1 = require("../../core/utils/httpResponse");
const listTeamMembers = async (req, res, next) => {
    var _a, _b;
    const user = req.user;
    if (!user) {
        (0, httpResponse_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const adminId = user.role === "admin" ? user.id : user.adminId;
    if (!adminId) {
        (0, httpResponse_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const q = (_a = req.query.q) === null || _a === void 0 ? void 0 : _a.trim();
    const searchFilter = q
        ? {
            OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { position: { contains: q, mode: "insensitive" } },
            ],
        }
        : {};
    const allowedSortFields = ["firstName", "lastName", "email", "position"];
    const sortBy = req.query.sortBy || "firstName";
    const sortOrder = ((_b = req.query.sortOrder) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "desc" ? "desc" : "asc";
    if (!allowedSortFields.includes(sortBy)) {
        (0, httpResponse_1.sendErrorResponse)(res, 400, `Invalid sortBy. Must be one of: ${allowedSortFields.join(", ")}`);
        return;
    }
    let statusFilter = { status: true };
    if (req.query.status === "false") {
        statusFilter.status = false;
    }
    const baseFilter = { ...searchFilter, ...statusFilter, adminId };
    try {
        const [total, teamMembers] = await Promise.all([
            database_config_1.prisma.teamMember.count({ where: baseFilter }),
            database_config_1.prisma.teamMember.findMany({
                where: baseFilter,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    position: true,
                    department: true,
                    role: true,
                    status: true,
                    createdAt: true,
                },
            }),
        ]);
        (0, httpResponse_1.sendSuccessResponse)(res, 200, "Team members fetched", {
            teamMembers,
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (err) {
        console.error("listTeamMembers error:", err);
        (0, httpResponse_1.sendErrorResponse)(res, 500, "Server error");
    }
};
exports.listTeamMembers = listTeamMembers;
const updateTeamMemberStatus = async (req, res, next) => {
    const user = req.user;
    if (!user || user.role !== "admin") {
        (0, httpResponse_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const { id } = req.params;
    const { status } = req.body;
    if (typeof status !== "boolean") {
        (0, httpResponse_1.sendErrorResponse)(res, 400, "`status` must be boolean");
        return;
    }
    try {
        const [teamMembers] = await database_config_1.prisma.$transaction([
            database_config_1.prisma.teamMember.update({
                where: { id },
                data: { status },
            }),
            database_config_1.prisma.loginCredential.updateMany({
                where: {
                    userProfileId: id,
                    role: "team_member",
                },
                data: { status },
            }),
        ]);
        (0, httpResponse_1.sendSuccessResponse)(res, 200, "TeamMember status updated", { teamMembers });
    }
    catch (err) {
        console.error("updateTeamMemberStatus error:", err);
        if (err.code === "P2025") {
            (0, httpResponse_1.sendErrorResponse)(res, 404, "TeamMember not found");
        }
        else {
            (0, httpResponse_1.sendErrorResponse)(res, 500, "Server error");
        }
        next(err);
    }
};
exports.updateTeamMemberStatus = updateTeamMemberStatus;
//# sourceMappingURL=team-members.controller.js.map