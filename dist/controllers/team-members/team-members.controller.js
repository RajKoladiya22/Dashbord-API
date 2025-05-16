"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTeamMemberStatus = exports.listTeamMembers = void 0;
const database_config_1 = require("../../config/database.config");
const httpResponse_1 = require("../../core/utils/httpResponse");
const listTeamMembers = async (req, res, next) => {
    var _a;
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
    try {
        const statusParam = (_a = req.query.status) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        const statusFilter = statusParam === "false" ? false : statusParam === "true" ? true : true;
        if (statusParam && typeof statusFilter !== "boolean") {
            (0, httpResponse_1.sendErrorResponse)(res, 400, "`status` must be boolean");
            return;
        }
        const teamMembers = await database_config_1.prisma.teamMember.findMany({
            where: { adminId, status: statusFilter },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                department: true,
                position: true,
                status: true,
                createdAt: true,
                role: true,
            },
        });
        (0, httpResponse_1.sendSuccessResponse)(res, 200, "Team members fetched", { teamMembers });
    }
    catch (err) {
        console.error("listTeamMembers error:", err);
        (0, httpResponse_1.sendErrorResponse)(res, 500, "Server error");
        next(err);
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