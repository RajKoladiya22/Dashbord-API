import { Request, Response, NextFunction } from "express";
import { prisma, env } from "../../config/database.config";
import { sendSuccessResponse, sendErrorResponse } from "../../core/utils/httpResponse";

export const listPartners = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const adminId = req.user?.id;
    if (!adminId) {
      sendErrorResponse(res, 401, "Unauthorized");
      return;
    }
  
    try {
      const partners = await prisma.partner.findMany({
        where: { adminId },          // filter by parent admin 
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          email: true,
          status: true,
          contactInfo: true,
          createdAt: true,
        },
      });
  
      sendSuccessResponse(res, 200, "Partners fetched", { partners });
    } catch (err) {
      console.error("listPartners error:", err);
      sendErrorResponse(res, 500, "Server error");
      next(err);
    }
  };