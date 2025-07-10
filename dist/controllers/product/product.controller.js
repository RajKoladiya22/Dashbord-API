"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeProductStatus = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.listProducts = void 0;
const database_config_1 = require("../../config/database.config");
const responseHandler_1 = require("../../core/utils/responseHandler");
const zod_1 = require("../../core/utils/zod");
const zod_2 = require("zod");
const listProducts = async (req, res, next) => {
    var _a;
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
    const statusParam = (_a = req.query.status) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    const statusFilter = statusParam === "false" ? false : statusParam === "true" ? true : true;
    if (statusParam && typeof statusFilter !== "boolean") {
        (0, responseHandler_1.sendErrorResponse)(res, 400, "`status` must be boolean");
        return;
    }
    const q = typeof req.query.q === "string" && req.query.q.trim();
    const page = Math.max(parseInt(`${req.query.page}`, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(`${req.query.perPage}`, 10) || 20, 1), 100);
    const skip = (page - 1) * perPage;
    try {
        const where = { adminId, status: statusFilter };
        if (q) {
            where.productName = { contains: q, mode: "insensitive" };
        }
        const [total, product] = await database_config_1.prisma.$transaction([
            database_config_1.prisma.product.count({ where }),
            database_config_1.prisma.product.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: perPage,
                select: {
                    id: true,
                    productName: true,
                    productPrice: true,
                    productCategory: true,
                    description: true,
                    productLink: true,
                    tags: true,
                    status: true,
                    specifications: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
        ]);
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Products fetched", {
            meta: {
                total,
                page,
                perPage,
                totalPages: Math.ceil(total / perPage),
            },
            product,
        });
    }
    catch (err) {
        console.error("listProducts error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
        next(err);
    }
};
exports.listProducts = listProducts;
const createProduct = async (req, res, next) => {
    const { product_name, product_category, product_price, description, product_link, tags, specifications, } = req.body;
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
        const product = await database_config_1.prisma.$transaction(async (tx) => {
            return tx.product.create({
                data: {
                    adminId,
                    productName: product_name,
                    productCategory: product_category,
                    productPrice: product_price,
                    description,
                    productLink: product_link,
                    tags,
                    specifications,
                },
                select: {
                    id: true,
                    productName: true,
                    productCategory: true,
                    productPrice: true,
                    description: true,
                    productLink: true,
                    tags: true,
                    status: true,
                    specifications: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 201, "Product created", { product });
    }
    catch (err) {
        console.error("createProduct error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
        return;
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res, next) => {
    const idSchema = zod_2.z.object({ id: zod_2.z.string().uuid() });
    const paramResult = idSchema.safeParse(req.params);
    if (!paramResult.success) {
        (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid product ID");
        return;
    }
    const { id } = paramResult.data;
    const updates = req.body;
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
        const product = await database_config_1.prisma.$transaction(async (tx) => {
            const existing = await tx.product.findUnique({
                where: { id },
                select: { adminId: true },
            });
            if (!existing || existing.adminId !== adminId) {
                throw new Error("Not found or unauthorized");
            }
            return tx.product.update({
                where: { id },
                data: {
                    productName: updates.productName,
                    productCategory: updates.productCategory,
                    productPrice: updates.productPrice,
                    description: updates.description,
                    productLink: updates.productLink,
                    tags: updates.tags,
                    specifications: updates.specifications,
                },
                select: {
                    id: true,
                    productName: true,
                    productCategory: true,
                    productPrice: true,
                    description: true,
                    productLink: true,
                    tags: true,
                    specifications: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Product updated", { product });
        return;
    }
    catch (err) {
        console.error("updateProduct error:", err);
        if (err.message === "Not found or unauthorized") {
            (0, responseHandler_1.sendErrorResponse)(res, 404, err.message);
            return;
        }
        else {
            (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
            return;
        }
        next(err);
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res, next) => {
    const idSchema = zod_2.z.object({ id: zod_2.z.string().uuid() });
    const parse = idSchema.safeParse(req.params);
    if (!parse.success) {
        (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid product ID");
        return;
    }
    const { id } = parse.data;
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
        await database_config_1.prisma.$transaction(async (tx) => {
            const existing = await tx.product.findUnique({
                where: { id },
                select: { adminId: true },
            });
            if (!existing || existing.adminId !== adminId) {
                throw new Error("Not found or unauthorized");
            }
            await tx.product.delete({ where: { id } });
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Product deleted");
    }
    catch (err) {
        console.error("deleteProduct error:", err);
        if (err.message === "Not found or unauthorized") {
            (0, responseHandler_1.sendErrorResponse)(res, 404, err.message);
            return;
        }
        else {
            (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
            return;
        }
    }
};
exports.deleteProduct = deleteProduct;
const changeProductStatus = async (req, res) => {
    const { id } = req.params;
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
    const parsed = zod_1.statusSchema.safeParse(req.body);
    if (!parsed.success) {
        (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid input", {
            errors: parsed.error.errors,
        });
        return;
    }
    try {
        const existing = await database_config_1.prisma.product.findUnique({
            where: { id },
            select: { adminId: true },
        });
        if (!existing || existing.adminId !== adminId) {
            (0, responseHandler_1.sendErrorResponse)(res, 404, "Product not found or unauthorized");
            return;
        }
        const updatedProduct = await database_config_1.prisma.product.update({
            where: { id },
            data: { status: parsed.data.status },
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Product status updated", {
            product: updatedProduct,
        });
    }
    catch (err) {
        console.error("changeProductStatus error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
    }
};
exports.changeProductStatus = changeProductStatus;
//# sourceMappingURL=product.controller.js.map