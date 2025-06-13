"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAdminCustomFields = exports.deleteAdminCustomField = exports.updateAdminCustomField = exports.createAdminCustomField = void 0;
const database_config_1 = require("../../config/database.config");
const responseHandler_1 = require("../../core/utils/responseHandler");
const zod_1 = require("../../core/utils/zod");
const createAdminCustomField = async (req, res, next) => {
    var _a, _b, _c;
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
    const parsed = zod_1.createCustomFieldSchema.safeParse(req.body);
    if (!parsed.success) {
        (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid input", {
            errors: parsed.error.errors,
        });
        return;
    }
    try {
        const adminCustomField = await database_config_1.prisma.adminCustomField.create({
            data: {
                adminId,
                fieldName: parsed.data.fieldName,
                fieldType: parsed.data.fieldType,
                isRequired: (_a = parsed.data.isRequired) !== null && _a !== void 0 ? _a : false,
                options: (_b = parsed.data.options) !== null && _b !== void 0 ? _b : [],
                isMultiSelect: (_c = parsed.data.isMultiSelect) !== null && _c !== void 0 ? _c : false,
            },
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 201, "Custom field created", {
            adminCustomField,
        });
        return;
    }
    catch (err) {
        console.error("createAdminCustomField error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
        return;
    }
};
exports.createAdminCustomField = createAdminCustomField;
const updateAdminCustomField = async (req, res, next) => {
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
    const parsed = zod_1.updateCustomFieldSchema.safeParse(req.body);
    if (!parsed.success) {
        (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid input", {
            errors: parsed.error.errors,
        });
        return;
    }
    try {
        const existingField = await database_config_1.prisma.adminCustomField.findUnique({
            where: { id, adminId },
        });
        if (!existingField || existingField.adminId !== adminId) {
            (0, responseHandler_1.sendErrorResponse)(res, 404, "Custom field not found or unauthorized");
            return;
        }
        const adminCustomField = await database_config_1.prisma.adminCustomField.update({
            where: { id, adminId },
            data: parsed.data,
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Custom field updated", {
            adminCustomField,
        });
        return;
    }
    catch (err) {
        console.error("updateAdminCustomField error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
        return;
    }
};
exports.updateAdminCustomField = updateAdminCustomField;
const deleteAdminCustomField = async (req, res, next) => {
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
        const existingField = await database_config_1.prisma.adminCustomField.findUnique({
            where: { id, adminId },
        });
        if (!existingField || existingField.adminId !== adminId) {
            (0, responseHandler_1.sendErrorResponse)(res, 404, "Custom field not found or unauthorized");
            return;
        }
        const adminCustomField = await database_config_1.prisma.adminCustomField.delete({
            where: { id, adminId },
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Custom field deleted", {
            adminCustomField,
        });
        return;
    }
    catch (err) {
        console.error("deleteAdminCustomField error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
        return;
    }
};
exports.deleteAdminCustomField = deleteAdminCustomField;
const listAdminCustomFields = async (req, res, next) => {
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
        const adminCustomFields = await database_config_1.prisma.adminCustomField.findMany({
            where: { adminId },
            orderBy: { createdAt: "asc" },
            select: {
                id: true,
                fieldName: true,
                fieldType: true,
                isRequired: true,
                options: true,
                isMultiSelect: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Custom fields fetched", {
            adminCustomFields,
        });
        return;
    }
    catch (err) {
        console.error("listAdminCustomFields error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
        return;
    }
};
exports.listAdminCustomFields = listAdminCustomFields;
//# sourceMappingURL=custommField.controller.js.map