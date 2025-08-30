import { createAndUpdateCustomerCategorySchema, specializationSchema, updateSpecializationSchema } from "../../core/utils/zod";
import { prisma } from "../../config/database.config";
import { sendErrorResponse, sendSuccessResponse } from "../../core/utils/responseHandler";
import { Request, Response, NextFunction } from "express";

const categoryRes = {
    id: true,
    categoryName: true,
    specialization: true,
    createdAt: true,
    updatedAt: true,
}

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
        const isExistSameCategory = await prisma.customerCategory.findFirst({
            where: {
                adminId,
                categoryName: parsed.data.categoryName,
            }
        });

        if (isExistSameCategory) {
            sendErrorResponse(res, 400, `"${isExistSameCategory.categoryName}" category already exists`);
            return;
        }

        const category = await prisma.customerCategory.create({
            data: {
                adminId,
                categoryName: parsed.data.categoryName,
                // specialization: parsed.data.specialization,
            },
            select: categoryRes,
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
            select: categoryRes,
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
    // console.log("parsed.data ---> ", parsed.data);

    try {
        const existingCategory = await prisma.customerCategory.findUnique({
            where: { id, adminId },
        });
        // console.log("existingCategory ---> ", existingCategory);

        if (!existingCategory) {
            sendErrorResponse(res, 404, "Customer Category not found");
            return;
        }

        // const mergedSpecializations = [
        //     ...(existingCategory.specialization || []),
        //     ...(parsed.data.specialization || []),
        // ];
        // // console.log("mergedSpecializations ---> ", mergedSpecializations);

        // const uniqueSpecializations = Array.from(new Set(mergedSpecializations));
        // // console.log("uniqueSpecializations ---> ", uniqueSpecializations);

        const category = await prisma.customerCategory.update({
            where: { id, adminId },
            data: {
                categoryName: parsed.data.categoryName,
                // specialization: uniqueSpecializations,
            },
            select: categoryRes,
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
            select: categoryRes,
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

// ------ Specialization -------

export const addSpecialization = async (
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
    const parsed = specializationSchema.safeParse(req.body);
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
        // console.log("existingCategory ---> ", existingCategory);

        if (!existingCategory) {
            sendErrorResponse(res, 404, "Customer Category not found");
            return;
        }

        if (existingCategory.specialization.includes(parsed.data.specialization)) {
            sendErrorResponse(res, 400, `"${parsed.data.specialization}" specialization already exists`);
            return;
        }

        const category = await prisma.customerCategory.update({
            where: { id, adminId },
            data: {
                specialization: { push: parsed.data.specialization },
            },
            select: categoryRes,
        });

        sendSuccessResponse(res, 201, "Specialization added", {
            category,
        });
        return;
    } catch (err) {
        console.error("addSpecialization error:", err);
        sendErrorResponse(res, 500, "Server error");
        return;
    }
};

export const updateSpecialization = async (
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
    const parsed = updateSpecializationSchema.safeParse(req.body);
    if (!parsed.success) {
        sendErrorResponse(res, 400, "Invalid input", {
            errors: parsed.error.errors,
        });
        return;
    }
    const { newCategoryId } = parsed.data;

    try {
        const existingCategory = await prisma.customerCategory.findUnique({
            where: { id, adminId },
        });
        // console.log("existingCategory ---> ", existingCategory);

        if (!existingCategory) {
            sendErrorResponse(res, 404, "Customer Category not found");
            return;
        }

        let oldCat: {
            id: string,
            categoryName: string,
            specialization: string[],
            createdAt: Date,
            updatedAt: Date,
        } | null = null;
        let newCat: {
            id: string,
            categoryName: string,
            specialization: string[],
            createdAt: Date,
            updatedAt: Date,
        } | null = null;
        if (newCategoryId) {
            const newCategoryForSpec = await prisma.customerCategory.findUnique({
                where: { id: newCategoryId, adminId },
            });
            if (!newCategoryForSpec) {
                sendErrorResponse(res, 404, "New Selected Customer Category not found");
                return;
            }

            if (newCategoryForSpec.specialization.includes(parsed.data.newSpecialization)) {
                sendErrorResponse(res, 400, `"${parsed.data.newSpecialization}" specialization already exists in "${newCategoryForSpec.categoryName}"`);
                return;
            }

            const deleteFromOld = existingCategory.specialization.filter((s) => s !== parsed.data.oldSpecialization);
            oldCat = await prisma.customerCategory.update({
                where: { id, adminId },
                data: { specialization: deleteFromOld },
                select: categoryRes,
            });

            newCat = await prisma.customerCategory.update({
                where: { id: newCategoryId, adminId },
                data: { specialization: { push: parsed.data.newSpecialization } },
                select: categoryRes,
            });
        } else {
            const updatedList = existingCategory.specialization.map((s) => s === parsed.data.oldSpecialization ? parsed.data.newSpecialization : s);
            oldCat = await prisma.customerCategory.update({
                where: { id, adminId },
                data: { specialization: updatedList },
                select: categoryRes,
            });
        }

        sendSuccessResponse(res, 200, "Specialization updated", {
            oldCat,
            newCat,
        });
        return;
    } catch (err) {
        console.error("addSpecialization error:", err);
        sendErrorResponse(res, 500, "Server error");
        return;
    }
};

export const deleteSpecialization = async (
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
    const specialization = req.body.specialization as string;

    try {
        const existingCategory = await prisma.customerCategory.findUnique({
            where: { id, adminId },
        });
        // console.log("existingCategory ---> ", existingCategory);

        if (!existingCategory) {
            sendErrorResponse(res, 404, "Customer Category not found");
            return;
        }

        const updatedList = existingCategory.specialization.filter((s) => s !== specialization);

        const category = await prisma.customerCategory.update({
            where: { id, adminId },
            data: { specialization: updatedList },
            select: categoryRes,
        });

        sendSuccessResponse(res, 200, "Specialization deleted", {
            category,
        });
        return;
    } catch (err) {
        console.error("addSpecialization error:", err);
        sendErrorResponse(res, 500, "Server error");
        return;
    }
};