import { Request, Response, NextFunction } from "express";
import { prisma, env } from "../../config/database.config";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../core/utils/httpResponse";

export const listTeamMembers = async (
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
    const teamMembers = await prisma.teamMember.findMany({
      where: { adminId }, // same filtering pattern :contentReference[oaicite:1]{index=1}
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        department: true,
        position: true,
        status: true,
        createdAt: true,
      },
    });

    sendSuccessResponse(res, 200, "Team members fetched", { teamMembers });
  } catch (err) {
    console.error("listTeamMembers error:", err);
    sendErrorResponse(res, 500, "Server error");
    next(err);
  }
};
