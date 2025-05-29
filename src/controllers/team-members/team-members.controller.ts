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
    // parse & validate status query param
    const statusParam = (req.query.status as string | undefined)?.toLowerCase();
    const statusFilter =
      statusParam === "false" ? false : statusParam === "true" ? true : true;

    if (statusParam && typeof statusFilter !== "boolean") {
      sendErrorResponse(res, 400, "`status` must be boolean"); // 400 Bad Request
      return;
    }
    // console.log("statusFilter----->", statusFilter);

    const teamMembers = await prisma.teamMember.findMany({
      where: { adminId, status: statusFilter },
      orderBy: { createdAt: "desc" }, // consistent ordering
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        department: true,
        position: true,
        status: true,
        createdAt: true,
        role: true,
      },
    });

    sendSuccessResponse(res, 200, "Team members fetched", { teamMembers }); // 200 OK
  } catch (err) {
    console.error("listTeamMembers error:", err);
    sendErrorResponse(res, 500, "Server error"); // 500 Internal Server Error
    next(err);
  }
};

export const updateTeamMemberStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  if (!user || user.role !== "admin") {
    sendErrorResponse(res, 401, "Unauthorized"); // only admins
    return;
  }

  const { id } = req.params;
  const { status } = req.body;
  if (typeof status !== "boolean") {
    sendErrorResponse(res, 400, "`status` must be boolean"); // validate body
    return;
  }

  try {
    // transaction: update TeamMember and linked LoginCredential
    const [teamMembers] = await prisma.$transaction([
      prisma.teamMember.update({
        where: { id },
        data: { status },
      }),
      prisma.loginCredential.updateMany({
        where: {
          userProfileId: id,
          role: "team_member",
        },
        data: { status },
      }),
    ]);

    sendSuccessResponse(res, 200, "TeamMember status updated", { teamMembers }); // 200 OK
  } catch (err: any) {
    console.error("updateTeamMemberStatus error:", err);
    if (err.code === "P2025") {
      // record not found
      sendErrorResponse(res, 404, "TeamMember not found"); // 404 Not Found
    } else {
      sendErrorResponse(res, 500, "Server error"); // 500 Server Error
    }
    next(err);
  }
};
