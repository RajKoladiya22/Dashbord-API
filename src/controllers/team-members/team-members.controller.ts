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
): Promise<void> => {
  const user = req.user;
  if (!user) {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }

  // Pagination
  const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit as string, 10) || 10, 1),
    100
  );
  const skip = (page - 1) * limit;

  // Search
  const q = (req.query.q as string)?.trim();
  const searchFilter = q
    ? {
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { position: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  // Sorting
  const allowedSortFields = ["firstName", "lastName", "email", "position"];
  const sortBy = (req.query.sortBy as string) || "firstName";
  const sortOrder =
    (req.query.sortOrder as string)?.toLowerCase() === "desc" ? "desc" : "asc";

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
  const baseFilter: any = { ...searchFilter, ...statusFilter };

  try {
    const [total, teamMembers] = await Promise.all([
      prisma.teamMember.count({ where: baseFilter }),
      prisma.teamMember.findMany({
        where: baseFilter,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          position: true,
          department: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    sendSuccessResponse(res, 200, "Team members fetched", {
      teamMembers,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("listTeamMembers error:", err);
    sendErrorResponse(res, 500, "Server error");
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
