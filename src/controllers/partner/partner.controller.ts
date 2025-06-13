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
): Promise<void> => {
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

  // Pagination
  const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  // Search
  const q = (req.query.q as string)?.trim();
  const searchFilter = q
    ? {
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { companyName: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  // Sorting
  const allowedSortFields = ["firstName", "lastName", "email", "companyName", "createdAt"];
  const sortBy = (req.query.sortBy as string) || "createdAt";
  const sortOrder = (req.query.sortOrder as string)?.toLowerCase() === "asc" ? "asc" : "desc";

  if (!allowedSortFields.includes(sortBy)) {
    sendErrorResponse(
      res,
      400,
      `Invalid sortBy. Must be one of: ${allowedSortFields.join(", ")}`
    );
    return;
  }

  // Optional status filter
  let statusFilter = { status: true };
  if (req.query.status === "false") {
    statusFilter.status = false;
  }

  // Final filter
  const baseFilter: any = {
    adminId,
    ...searchFilter,
    ...statusFilter,
  };

  try {
    const [total, partners] = await Promise.all([
      prisma.partner.count({ where: baseFilter }),
      prisma.partner.findMany({
        where: baseFilter,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          email: true,
          contactInfo: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    sendSuccessResponse(res, 200, "Partners fetched", {
      partners,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("listPartners error:", err);
    sendErrorResponse(res, 500, "Server error");
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
