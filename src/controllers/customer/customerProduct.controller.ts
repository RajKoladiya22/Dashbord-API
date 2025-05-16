// src/controllers/customer/customerProduct.controller.ts

import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.config";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../core/utils/responseHandler";

export const getCustomerProductsByCustomerId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { customerId } = req.params;
  const user = req.user as { id: string; role: string; adminId?: string };

  if (!user) {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }

  const adminId = user.role === "admin" ? user.id : user.adminId!;
  const scopeFilter: any = { id: customerId, adminId };
  if (user.role === "partner") scopeFilter.partnerId = user.id;

  if (!adminId) {
    sendErrorResponse(res, 403, "Forbidden: Admin ID not found");
    return;
  }

  try {
    // const history = {}
    const customer = await prisma.customer.findUnique({ where: scopeFilter });
    const history = await prisma.customerProductHistory.findMany({
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

    sendSuccessResponse(res, 200, "Customer products fetched", { history });
    return;
  } catch (error) {
    console.error("Error fetching customer products:", error);
    sendErrorResponse(res, 500, "Server error");
    return;
  }
};
