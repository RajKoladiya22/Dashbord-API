import { Request, Response, NextFunction } from "express";
import { prisma, env } from "../../config/database.config";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../core/utils/httpResponse";

export const listPartners = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  if (!user) {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }
  const adminId = user.role === "admin" ? user.id : user.adminId;
  if (!adminId) {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }

  try {
    const statusParam = (req.query.status as string | undefined)?.toLowerCase();
    // console.log("statusParam---->", statusParam);

    
    const statusFilter = 
      statusParam === "false" ? false 
      : statusParam === "true"  ? true 
      : true;  

      if (typeof statusFilter !== "boolean") {
        sendErrorResponse(res, 400, "`status` must be boolean");
        return;
      }
      

    const partners = await prisma.partner.findMany({
      where: { adminId, status: statusFilter }, // filter by parent admin and status
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
    // console.log("partners---->", partners);

    sendSuccessResponse(res, 200, "Partners fetched", { partners });
  } catch (err) {
    console.error("listPartners error:", err);
    sendErrorResponse(res, 500, "Server error");
    next(err);
  }
};

export const updatePartnerStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1️⃣ Auth: ensure user is admin
    const user = req.user;
    if (!user || user.role !== "admin") {
      sendErrorResponse(res, 401, "Unauthorized"); // only admins allowed
      return;
    }

    // 2️⃣ Validate inputs
    const { id } = req.params;
    const { status } = req.body;
    //console.log("status---->", status);
    //console.log("id---->", id);
    
    // if (!status) {
    //   sendErrorResponse(res, 400, "status not found");
    //   return;
    // }
    // console.log("status---->", status);
    

    // 3️⃣ Transaction: update Partner.status and LoginCredential.status together
    const [partners] = await prisma.$transaction([
      prisma.partner.update({
        where: { id },
        data: { status },
      }),
      prisma.loginCredential.updateMany({
        where: {
          userProfileId: id,
          role: "partner",
        },
        data: { status },
      }),
    ]);

    // 4️⃣ Return updated partner
    sendSuccessResponse(res, 200, "Partner status updated", { partners });
  } catch (error) {
    console.error("updatePartnerStatus error:", error);
    sendErrorResponse(res, 500, "Server error");
  }
};
