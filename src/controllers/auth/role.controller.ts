import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.config";
import { Prisma, Role } from "@prisma/client";
import { sendErrorResponse, sendSuccessResponse } from "../../core/utils/httpResponse";

export const updateTeamRole = async (
  req: Request<{ id: string }, {}, {}>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const teamMemberId = req.params.id;
  const user = req.user;

  if (!user) {
    sendErrorResponse(res, 403, "Unauthorized");
    return;
  }
  if (!user || user.role !== "admin") {
    sendErrorResponse(res, 403, "Forbidden: Admins only");
    return;
  }

  try {
    const existingMember = await prisma.teamMember.findUnique({
      where: { id: teamMemberId },
    });

    if (!existingMember) {
      sendErrorResponse(res, 404, "Team member not found");
      return;
    }

    let newRole: Role;
    if (existingMember.role === Role.team_member) {
      newRole = Role.sub_admin;
    } else if (existingMember.role === Role.sub_admin) {
      newRole = Role.team_member;
    } else {
      sendErrorResponse(res, 400, "Invalid role to toggle");
      return;
    }

    // const updatedMember = await prisma.teamMember.update({
    //   where: { id: teamMemberId },
    //   data: { role: newRole },
    // });

    // First, find the loginCredential by userProfileId to get its unique id
    const loginCredential = await prisma.loginCredential.findFirst({
      where: { userProfileId: teamMemberId },
    });

    if (!loginCredential) {
      sendErrorResponse(res, 404, "Login credential not found");
      return;
    }

    const [updatedMember, updatedCredential] = await prisma.$transaction([
      prisma.teamMember.update({
        where: { id: teamMemberId },
        data: { role: newRole },
      }),
      prisma.loginCredential.update({
        where: { id: loginCredential.id },
        data: { role: newRole },
      }),
    ]);
    sendSuccessResponse(res, 200, "Role updated successfully", updatedMember);
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        sendErrorResponse(res, 404, "Team member not found");
        return;
      }
      if (err.code === "P2003") {
        sendErrorResponse(res, 400, "Invalid scope or foreign key");
        return;
      }
    }

    console.error("updateTeamRole error:", err);
    if (!res.headersSent) {
      next(err);
    } else {
      console.error("role change error:", err);
      sendErrorResponse(res, 500, "Server error");
    }
  }
};
