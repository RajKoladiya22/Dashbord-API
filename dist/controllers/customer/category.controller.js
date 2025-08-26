"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCustomerCategory = exports.updateCustomerCategory = exports.listCustomerCategories = exports.createCustomerCategory = void 0;
const zod_1 = require("../../core/utils/zod");
const database_config_1 = require("../../config/database.config");
const responseHandler_1 = require("../../core/utils/responseHandler");
const createCustomerCategory = async (req, res, next) => {
    const user = req.user;
    if (!user) {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const adminId = user.role === "admin" ? user.id : user.adminId;
    if (!adminId) {
        (0, responseHandler_1.sendErrorResponse)(res, 403, "Cannot determine admin context");
        return;
    }
    const parsed = zod_1.createAndUpdateCustomerCategorySchema.safeParse(req.body);
    if (!parsed.success) {
        (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid input", {
            errors: parsed.error.errors,
        });
        return;
    }
    try {
        const category = await database_config_1.prisma.customerCategory.create({
            data: {
                adminId,
                categoryName: parsed.data.categoryName,
                specialization: parsed.data.specialization,
            },
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 201, "Customer Category created", {
            category,
        });
        return;
    }
    catch (err) {
        console.error("createCustomerCategory error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
        return;
    }
};
exports.createCustomerCategory = createCustomerCategory;
const listCustomerCategories = async (req, res, next) => {
    const user = req.user;
    if (!user) {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const adminId = user.role === "admin" ? user.id : user.adminId;
    if (!adminId) {
        (0, responseHandler_1.sendErrorResponse)(res, 403, "Cannot determine admin context");
        return;
    }
    try {
        const categories = await database_config_1.prisma.customerCategory.findMany({
            where: { adminId },
            orderBy: { createdAt: "asc" },
            select: {
                id: true,
                categoryName: true,
                specialization: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Customer Category fetched", {
            categories,
        });
        return;
    }
    catch (err) {
        console.error("listCustomerCategories error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
        return;
    }
};
exports.listCustomerCategories = listCustomerCategories;
const updateCustomerCategory = async (req, res, next) => {
    const user = req.user;
    if (!user) {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const adminId = user.role === "admin" ? user.id : user.adminId;
    if (!adminId) {
        (0, responseHandler_1.sendErrorResponse)(res, 403, "Cannot determine admin context");
        return;
    }
    const { id } = req.params;
    const parsed = zod_1.createAndUpdateCustomerCategorySchema.safeParse(req.body);
    if (!parsed.success) {
        (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid input", {
            errors: parsed.error.errors,
        });
        return;
    }
    try {
        const existingCategory = await database_config_1.prisma.customerCategory.findUnique({
            where: { id, adminId },
        });
        if (!existingCategory || existingCategory.adminId !== adminId) {
            (0, responseHandler_1.sendErrorResponse)(res, 404, "Customer Category not found or unauthorized");
            return;
        }
        const category = await database_config_1.prisma.customerCategory.update({
            where: { id, adminId },
            data: parsed.data,
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Customer Category updated", {
            category,
        });
        return;
    }
    catch (err) {
        console.error("updateCustomerCategory error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
        return;
    }
};
exports.updateCustomerCategory = updateCustomerCategory;
const deleteCustomerCategory = async (req, res, next) => {
    const user = req.user;
    if (!user) {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const adminId = user.role === "admin" ? user.id : user.adminId;
    if (!adminId) {
        (0, responseHandler_1.sendErrorResponse)(res, 403, "Cannot determine admin context");
        return;
    }
    const { id } = req.params;
    try {
        const existingCategory = await database_config_1.prisma.customerCategory.findUnique({
            where: { id, adminId },
        });
        if (!existingCategory || existingCategory.adminId !== adminId) {
            (0, responseHandler_1.sendErrorResponse)(res, 404, "Customer Category not found or unauthorized");
            return;
        }
        const category = await database_config_1.prisma.customerCategory.delete({
            where: { id, adminId },
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Customer Category deleted", {
            category,
        });
        return;
    }
    catch (err) {
        console.error("deleteCustomerCategory error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
        return;
    }
};
exports.deleteCustomerCategory = deleteCustomerCategory;
//# sourceMappingURL=category.controller.js.map