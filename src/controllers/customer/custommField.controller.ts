import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.config";
import { z } from "zod";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../core/utils/responseHandler";

const createCustomFieldSchema = z.object({
  fieldName: z.string().min(1),
  fieldType: z.string().min(1),
  isRequired: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  isMultiSelect: z.boolean().optional(),
});

export const createAdminCustomField = async (
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

  const parsed = createCustomFieldSchema.safeParse(req.body);
  if (!parsed.success) {
    sendErrorResponse(res, 400, "Invalid input", {
      errors: parsed.error.errors,
    });
    return;
  }

  try {
    const adminCustomField = await prisma.adminCustomField.create({
      data: {
        adminId,
        fieldName: parsed.data.fieldName,
        fieldType: parsed.data.fieldType,
        isRequired: parsed.data.isRequired ?? false,
        options: parsed.data.options ?? [],
        isMultiSelect: parsed.data.isMultiSelect ?? false,
      },
    });

    sendSuccessResponse(res, 201, "Custom field created", {
      adminCustomField,
    });
    return;
  } catch (err) {
    console.error("createAdminCustomField error:", err);
    sendErrorResponse(res, 500, "Server error");
    return;
  }
};

const updateCustomFieldSchema = z.object({
  fieldName: z.string().min(1).optional(),
  fieldType: z.string().min(1).optional(),
  isRequired: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  isMultiSelect: z.boolean().optional(),
});

export const updateAdminCustomField = async (
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
  const parsed = updateCustomFieldSchema.safeParse(req.body);
  if (!parsed.success) {
    sendErrorResponse(res, 400, "Invalid input", {
      errors: parsed.error.errors,
    });
    return;
  }

  try {
    const existingField = await prisma.adminCustomField.findUnique({
      where: { id },
    });

    if (!existingField || existingField.adminId !== adminId) {
      sendErrorResponse(res, 404, "Custom field not found or unauthorized");
      return;
    }

    const adminCustomField = await prisma.adminCustomField.update({
      where: { id },
      data: parsed.data,
    });

    sendSuccessResponse(res, 200, "Custom field updated", {
      adminCustomField,
    });
    return;
  } catch (err) {
    console.error("updateAdminCustomField error:", err);
    sendErrorResponse(res, 500, "Server error");
    return;
  }
};

export const deleteAdminCustomField = async (
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
    const existingField = await prisma.adminCustomField.findUnique({
      where: { id },
    });

    if (!existingField || existingField.adminId !== adminId) {
      sendErrorResponse(res, 404, "Custom field not found or unauthorized");
      return;
    }

    const adminCustomField = await prisma.adminCustomField.delete({
      where: { id },
    });

    sendSuccessResponse(res, 200, "Custom field deleted", {
      adminCustomField,
    });
    return;
  } catch (err) {
    console.error("deleteAdminCustomField error:", err);
    sendErrorResponse(res, 500, "Server error");
    return;
  }
};

export const listAdminCustomFields = async (
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
    const adminCustomFields = await prisma.adminCustomField.findMany({
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

    sendSuccessResponse(res, 200, "Custom fields fetched", {
      adminCustomFields,
    });
    return;
  } catch (err) {
    console.error("listAdminCustomFields error:", err);
    sendErrorResponse(res, 500, "Server error");
    return;
  }
};
