"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePartnerStatus = exports.listPartners = void 0;
const database_config_1 = require("../../config/database.config");
const httpResponse_1 = require("../../core/utils/httpResponse");
const listPartners = async (req, res, next) => {
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
        const statusFilter = statusParam === "false" ? false
            : statusParam === "true" ? true
                : true;
        if (typeof statusFilter !== "boolean") {
            (0, httpResponse_1.sendErrorResponse)(res, 400, "`status` must be boolean");
            return;
        }
        const partners = await database_config_1.prisma.partner.findMany({
            where: { adminId, status: statusFilter },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                companyName: true,
                email: true,
                status: true,
                contactInfo: true,
                createdAt: true,
            },
        });
        (0, httpResponse_1.sendSuccessResponse)(res, 200, "Partners fetched", { partners });
    }
    catch (err) {
        console.error("listPartners error:", err);
        (0, httpResponse_1.sendErrorResponse)(res, 500, "Server error");
        next(err);
    }
};
exports.listPartners = listPartners;
const updatePartnerStatus = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user || user.role !== "admin") {
            (0, httpResponse_1.sendErrorResponse)(res, 401, "Unauthorized");
            return;
        }
        const { id } = req.params;
        const { status } = req.body;
        const [partners] = await database_config_1.prisma.$transaction([
            database_config_1.prisma.partner.update({
                where: { id },
                data: { status },
            }),
            database_config_1.prisma.loginCredential.updateMany({
                where: {
                    userProfileId: id,
                    role: "partner",
                },
                data: { status },
            }),
        ]);
        (0, httpResponse_1.sendSuccessResponse)(res, 200, "Partner status updated", { partners });
    }
    catch (error) {
        console.error("updatePartnerStatus error:", error);
        (0, httpResponse_1.sendErrorResponse)(res, 500, "Server error");
    }
};
exports.updatePartnerStatus = updatePartnerStatus;
//# sourceMappingURL=partner.controller.js.map