"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePartnerStatus = exports.listPartners = void 0;
const database_config_1 = require("../../config/database.config");
const httpResponse_1 = require("../../core/utils/httpResponse");
const listPartners = async (req, res, next) => {
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
                { companyName: { contains: q, mode: "insensitive" } },
            ],
        }
        : {};
    const allowedSortFields = ["firstName", "lastName", "email", "companyName", "createdAt"];
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = ((_b = req.query.sortOrder) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "asc" ? "asc" : "desc";
    if (!allowedSortFields.includes(sortBy)) {
        (0, httpResponse_1.sendErrorResponse)(res, 400, `Invalid sortBy. Must be one of: ${allowedSortFields.join(", ")}`);
        return;
    }
    let statusFilter = { status: true };
    if (req.query.status === "false") {
        statusFilter.status = false;
    }
    const baseFilter = {
        adminId,
        ...searchFilter,
        ...statusFilter,
    };
    try {
        const [total, partners] = await Promise.all([
            database_config_1.prisma.partner.count({ where: baseFilter }),
            database_config_1.prisma.partner.findMany({
                where: baseFilter,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    companyName: true,
                    email: true,
                    contactInfo: true,
                    status: true,
                    createdAt: true,
                },
            }),
        ]);
        (0, httpResponse_1.sendSuccessResponse)(res, 200, "Partners fetched", {
            partners,
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (err) {
        console.error("listPartners error:", err);
        (0, httpResponse_1.sendErrorResponse)(res, 500, "Server error");
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