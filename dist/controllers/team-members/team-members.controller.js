"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTeamMembers = void 0;
const database_config_1 = require("../../config/database.config");
const httpResponse_1 = require("../../core/utils/httpResponse");
const listTeamMembers = async (req, res, next) => {
    var _a;
    const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!adminId) {
        (0, httpResponse_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    try {
        const teamMembers = await database_config_1.prisma.teamMember.findMany({
            where: { adminId },
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
//# sourceMappingURL=team-members.controller.js.map