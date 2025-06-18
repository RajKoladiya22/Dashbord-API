"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTeamRole = void 0;
const database_config_1 = require("../../config/database.config");
const client_1 = require("@prisma/client");
const httpResponse_1 = require("../../core/utils/httpResponse");
const updateTeamRole = async (req, res, next) => {
    const teamMemberId = req.params.id;
    const user = req.user;
    if (!user) {
        (0, httpResponse_1.sendErrorResponse)(res, 403, "Unauthorized");
        return;
    }
    if (!user || user.role !== "admin") {
        (0, httpResponse_1.sendErrorResponse)(res, 403, "Forbidden: Admins only");
        return;
    }
    try {
        const existingMember = await database_config_1.prisma.teamMember.findUnique({
            where: { id: teamMemberId },
        });
        if (!existingMember) {
            (0, httpResponse_1.sendErrorResponse)(res, 404, "Team member not found");
            return;
        }
        let newRole;
        if (existingMember.role === client_1.Role.team_member) {
            newRole = client_1.Role.sub_admin;
        }
        else if (existingMember.role === client_1.Role.sub_admin) {
            newRole = client_1.Role.team_member;
        }
        else {
            (0, httpResponse_1.sendErrorResponse)(res, 400, "Invalid role to toggle");
            return;
        }
        const loginCredential = await database_config_1.prisma.loginCredential.findFirst({
            where: { userProfileId: teamMemberId },
        });
        if (!loginCredential) {
            (0, httpResponse_1.sendErrorResponse)(res, 404, "Login credential not found");
            return;
        }
        const [updatedMember, updatedCredential] = await database_config_1.prisma.$transaction([
            database_config_1.prisma.teamMember.update({
                where: { id: teamMemberId },
                data: { role: newRole },
            }),
            database_config_1.prisma.loginCredential.update({
                where: { id: loginCredential.id },
                data: { role: newRole },
            }),
        ]);
        (0, httpResponse_1.sendSuccessResponse)(res, 200, "Role updated successfully", updatedMember);
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2025") {
                (0, httpResponse_1.sendErrorResponse)(res, 404, "Team member not found");
                return;
            }
            if (err.code === "P2003") {
                (0, httpResponse_1.sendErrorResponse)(res, 400, "Invalid scope or foreign key");
                return;
            }
        }
        console.error("updateTeamRole error:", err);
        if (!res.headersSent) {
            next(err);
        }
        else {
            console.error("role change error:", err);
            (0, httpResponse_1.sendErrorResponse)(res, 500, "Server error");
        }
    }
};
exports.updateTeamRole = updateTeamRole;
//# sourceMappingURL=role.controller.js.map