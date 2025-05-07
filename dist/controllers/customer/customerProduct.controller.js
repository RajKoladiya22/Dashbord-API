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
    if (!adminId) {
        (0, responseHandler_1.sendErrorResponse)(res, 403, "Forbidden: Admin ID not found");
        return;
    }
    try {
        const history = await database_config_1.prisma.customerProductHistory.findMany({
            where: {
                customerId,
                adminId,
                status: true,
            },
            include: {
                product: true,
            },
            orderBy: {
                purchaseDate: "desc",
            },
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Customer products fetched", { history });
        return;
    }
    catch (error) {
        return;
    }
};
exports.getCustomerProductsByCustomerId = getCustomerProductsByCustomerId;
//# sourceMappingURL=customerProduct.controller.js.map