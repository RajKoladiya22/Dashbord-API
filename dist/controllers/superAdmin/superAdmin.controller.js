"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAllDetails = void 0;
const database_config_1 = require("../../config/database.config");
const httpResponse_1 = require("../../core/utils/httpResponse");
const listAllDetails = async (req, res, next) => {
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
exports.listAllDetails = listAllDetails;
//# sourceMappingURL=superAdmin.controller.js.map