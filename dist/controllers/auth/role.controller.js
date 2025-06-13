"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTeamRole = void 0;
const database_config_1 = require("../../config/database.config");
const client_1 = require("@prisma/client");
const updateTeamRole = async (req, res, next) => {
    const teamMemberId = req.params.id;
    const user = req.user;
    if (!user) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
    }
    try {
        const existingMember = await database_config_1.prisma.teamMember.findUnique({
            where: { id: teamMemberId },
        });
        if (!existingMember) {
            res.status(404).json({ success: false, message: "Team member not found" });
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
            res.status(400).json({ success: false, message: "Invalid role to toggle" });
            return;
        }
        const updatedMember = await database_config_1.prisma.teamMember.update({
            where: { id: teamMemberId },
            data: { role: newRole },
        });
        res.status(200).json({
            success: true,
            message: "Role updated successfully",
            data: updatedMember,
        });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2025") {
                res.status(404).json({ success: false, message: "Team member not found" });
                return;
            }
            if (err.code === "P2003") {
                res.status(400).json({ success: false, message: "Invalid scope or foreign key" });
                return;
            }
        }
        console.error("updateTeamRole error:", err);
        if (!res.headersSent) {
            next(err);
        }
        else {
            res.status(500).json({ success: false, message: "Server error" });
        }
    }
};
exports.updateTeamRole = updateTeamRole;
//# sourceMappingURL=role.controller.js.map