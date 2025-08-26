import { createAndUpdateCustomerCategorySchema } from "../../core/utils/zod";
import { prisma } from "../../config/database.config";
import { sendErrorResponse, sendSuccessResponse } from "../../core/utils/responseHandler";
import { Request, Response, NextFunction } from "express";

export const createCustomerCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const user = req.user;
    if (!user) {
        sendErrorResponse(res, 401, "Unauthorized");
        return;
    }
    const adminId = user.role === "admin" ? user.id : user.adminId;
    if (!adminId) {
        sendErrorResponse(res, 403, "Cannot determine admin context");
        return;
    }

    const parsed = createAndUpdateCustomerCategorySchema.safeParse(req.body);
    if (!parsed.success) {
        sendErrorResponse(res, 400, "Invalid input", {
            errors: parsed.error.errors,
        });
        return;
    }

    try {
        const category = await prisma.customerCategory.create({
            data: {
                adminId,
                categoryName: parsed.data.categoryName,
                specialization: parsed.data.specialization,
            },
        });

        sendSuccessResponse(res, 201, "Customer Category created", {
            category,
        });
        return;
    } catch (err) {
        console.error("createCustomerCategory error:", err);
        sendErrorResponse(res, 500, "Server error");
        return;
    }
};

export const listCustomerCategories = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const user = req.user;
    //   console.log("user--------------------->", user);

    if (!user) {
        sendErrorResponse(res, 401, "Unauthorized");
        return;
    }

    // Determine adminId (self for admins; parent for partners/team)
    const adminId = user.role === "admin" ? user.id : user.adminId;
    if (!adminId) {
        sendErrorResponse(res, 403, "Cannot determine admin context");
        return;
    }

    try {
        const categories = await prisma.customerCategory.findMany({
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

        sendSuccessResponse(res, 200, "Customer Category fetched", {
            categories,
        });
        return;
    } catch (err) {
        console.error("listCustomerCategories error:", err);
        sendErrorResponse(res, 500, "Server error");
        return;
    }
};

export const updateCustomerCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const user = req.user;
    if (!user) {
        sendErrorResponse(res, 401, "Unauthorized");
        return;
    }
    const adminId = user.role === "admin" ? user.id : user.adminId;
    if (!adminId) {
        sendErrorResponse(res, 403, "Cannot determine admin context");
        return;
    }

    const { id } = req.params;
    const parsed = createAndUpdateCustomerCategorySchema.safeParse(req.body);
    if (!parsed.success) {
        sendErrorResponse(res, 400, "Invalid input", {
            errors: parsed.error.errors,
        });
        return;
    }

    try {
        const existingCategory = await prisma.customerCategory.findUnique({
            where: { id, adminId },
        });

        if (!existingCategory || existingCategory.adminId !== adminId) {
            sendErrorResponse(res, 404, "Customer Category not found or unauthorized");
            return;
        }

        const category = await prisma.customerCategory.update({
            where: { id, adminId },
            data: parsed.data,
        });

        sendSuccessResponse(res, 200, "Customer Category updated", {
            category,
        });
        return;
    } catch (err) {
        console.error("updateCustomerCategory error:", err);
        sendErrorResponse(res, 500, "Server error");
        return;
    }
};

export const deleteCustomerCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const user = req.user;
    if (!user) {
        sendErrorResponse(res, 401, "Unauthorized");
        return;
    }
    const adminId = user.role === "admin" ? user.id : user.adminId;
    if (!adminId) {
        sendErrorResponse(res, 403, "Cannot determine admin context");
        return;
    }

    const { id } = req.params;

    try {
        const existingCategory = await prisma.customerCategory.findUnique({
            where: { id, adminId },
        });

        if (!existingCategory || existingCategory.adminId !== adminId) {
            sendErrorResponse(res, 404, "Customer Category not found or unauthorized");
            return;
        }

        const category = await prisma.customerCategory.delete({
            where: { id, adminId },
        });

        sendSuccessResponse(res, 200, "Customer Category deleted", {
            category,
        });
        return;
    } catch (err) {
        console.error("deleteCustomerCategory error:", err);
        sendErrorResponse(res, 500, "Server error");
        return;
    }
};