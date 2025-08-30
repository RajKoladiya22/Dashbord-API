"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSpecialization = exports.updateSpecialization = exports.addSpecialization = exports.deleteCustomerCategory = exports.updateCustomerCategory = exports.listCustomerCategories = exports.createCustomerCategory = void 0;
const zod_1 = require("../../core/utils/zod");
const database_config_1 = require("../../config/database.config");
const responseHandler_1 = require("../../core/utils/responseHandler");
const categoryRes = {
    id: true,
    categoryName: true,
    specialization: true,
    createdAt: true,
    updatedAt: true,
};
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
        const isExistSameCategory = await database_config_1.prisma.customerCategory.findFirst({
            where: {
                adminId,
                categoryName: parsed.data.categoryName,
            }
        });
        if (isExistSameCategory) {
            (0, responseHandler_1.sendErrorResponse)(res, 400, `"${isExistSameCategory.categoryName}" category already exists`);
            return;
        }
        const category = await database_config_1.prisma.customerCategory.create({
            data: {
                adminId,
                categoryName: parsed.data.categoryName,
            },
            select: categoryRes,
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
            select: categoryRes,
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
        if (!existingCategory) {
            (0, responseHandler_1.sendErrorResponse)(res, 404, "Customer Category not found");
            return;
        }
        const category = await database_config_1.prisma.customerCategory.update({
            where: { id, adminId },
            data: {
                categoryName: parsed.data.categoryName,
            },
            select: categoryRes,
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
            select: categoryRes,
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
const addSpecialization = async (req, res, next) => {
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
    const parsed = zod_1.specializationSchema.safeParse(req.body);
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
        if (!existingCategory) {
            (0, responseHandler_1.sendErrorResponse)(res, 404, "Customer Category not found");
            return;
        }
        if (existingCategory.specialization.includes(parsed.data.specialization)) {
            (0, responseHandler_1.sendErrorResponse)(res, 400, `"${parsed.data.specialization}" specialization already exists`);
            return;
        }
        const category = await database_config_1.prisma.customerCategory.update({
            where: { id, adminId },
            data: {
                specialization: { push: parsed.data.specialization },
            },
            select: categoryRes,
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 201, "Specialization added", {
            category,
        });
        return;
    }
    catch (err) {
        console.error("addSpecialization error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
        return;
    }
};
exports.addSpecialization = addSpecialization;
const updateSpecialization = async (req, res, next) => {
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
    const parsed = zod_1.updateSpecializationSchema.safeParse(req.body);
    if (!parsed.success) {
        (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid input", {
            errors: parsed.error.errors,
        });
        return;
    }
    const { newCategoryId } = parsed.data;
    try {
        const existingCategory = await database_config_1.prisma.customerCategory.findUnique({
            where: { id, adminId },
        });
        if (!existingCategory) {
            (0, responseHandler_1.sendErrorResponse)(res, 404, "Customer Category not found");
            return;
        }
        let oldCat = null;
        let newCat = null;
        if (newCategoryId) {
            const newCategoryForSpec = await database_config_1.prisma.customerCategory.findUnique({
                where: { id: newCategoryId, adminId },
            });
            if (!newCategoryForSpec) {
                (0, responseHandler_1.sendErrorResponse)(res, 404, "New Selected Customer Category not found");
                return;
            }
            if (newCategoryForSpec.specialization.includes(parsed.data.newSpecialization)) {
                (0, responseHandler_1.sendErrorResponse)(res, 400, `"${parsed.data.newSpecialization}" specialization already exists in "${newCategoryForSpec.categoryName}"`);
                return;
            }
            const deleteFromOld = existingCategory.specialization.filter((s) => s !== parsed.data.oldSpecialization);
            oldCat = await database_config_1.prisma.customerCategory.update({
                where: { id, adminId },
                data: { specialization: deleteFromOld },
                select: categoryRes,
            });
            newCat = await database_config_1.prisma.customerCategory.update({
                where: { id: newCategoryId, adminId },
                data: { specialization: { push: parsed.data.newSpecialization } },
                select: categoryRes,
            });
        }
        else {
            const updatedList = existingCategory.specialization.map((s) => s === parsed.data.oldSpecialization ? parsed.data.newSpecialization : s);
            oldCat = await database_config_1.prisma.customerCategory.update({
                where: { id, adminId },
                data: { specialization: updatedList },
                select: categoryRes,
            });
        }
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Specialization updated", {
            oldCat,
            newCat,
        });
        return;
    }
    catch (err) {
        console.error("addSpecialization error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
        return;
    }
};
exports.updateSpecialization = updateSpecialization;
const deleteSpecialization = async (req, res, next) => {
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
    const specialization = req.body.specialization;
    try {
        const existingCategory = await database_config_1.prisma.customerCategory.findUnique({
            where: { id, adminId },
        });
        if (!existingCategory) {
            (0, responseHandler_1.sendErrorResponse)(res, 404, "Customer Category not found");
            return;
        }
        const updatedList = existingCategory.specialization.filter((s) => s !== specialization);
        const category = await database_config_1.prisma.customerCategory.update({
            where: { id, adminId },
            data: { specialization: updatedList },
            select: categoryRes,
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Specialization deleted", {
            category,
        });
        return;
    }
    catch (err) {
        console.error("addSpecialization error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
        return;
    }
};
exports.deleteSpecialization = deleteSpecialization;
//# sourceMappingURL=category.controller.js.map