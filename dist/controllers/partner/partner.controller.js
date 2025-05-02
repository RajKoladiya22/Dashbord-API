"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPartners = void 0;
const database_config_1 = require("../../config/database.config");
const httpResponse_1 = require("../../core/utils/httpResponse");
const listPartners = async (req, res, next) => {
    var _a;
    const adminId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!adminId) {
        (0, httpResponse_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    try {
        const partners = await database_config_1.prisma.partner.findMany({
            where: { adminId },
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
//# sourceMappingURL=partner.controller.js.map