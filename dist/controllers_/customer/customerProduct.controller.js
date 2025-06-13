"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerProductsByCustomerId = void 0;
const database_config_1 = require("../../config/database.config");
const responseHandler_1 = require("../../core/utils/responseHandler");
const getCustomerProductsByCustomerId = async (req, res, next) => {
    const { customerId } = req.params;
    const user = req.user;
    if (!user) {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const adminId = user.role === "admin" ? user.id : user.adminId;
    const scopeFilter = { id: customerId, adminId };
    if (user.role === "partner")
        scopeFilter.partnerId = user.id;
    if (!adminId) {
        (0, responseHandler_1.sendErrorResponse)(res, 403, "Forbidden: Admin ID not found");
        return;
    }
    try {
        const customer = await database_config_1.prisma.customer.findUnique({ where: scopeFilter });
        if (!customer) {
            (0, responseHandler_1.sendErrorResponse)(res, 404, "Customer not found");
            return;
        }
        const history = await database_config_1.prisma.customerProductHistory.findMany({
            where: {
                customerId,
                adminId,
                status: true,
                ...(user.role === "partner" && { partnerId: user.id }),
            },
            orderBy: { purchaseDate: "desc" },
            include: {
                product: true,
            },
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Customer products fetched", { history });
        return;
    }
    catch (error) {
        console.error("Error fetching customer products:", error);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
        return;
    }
};
exports.getCustomerProductsByCustomerId = getCustomerProductsByCustomerId;
//# sourceMappingURL=customerProduct.controller.js.map