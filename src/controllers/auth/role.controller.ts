import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.config";
import { Prisma, Role } from "@prisma/client";

export const updateTeamRole = async (
  req: Request<{ id: string }, {}, {}>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const teamMemberId = req.params.id;
  const user = req.user;

  if (!user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }
  if (!user || user.role !== "admin") {
    res.status(403).json({ success: false, message: "Forbidden: Admins only" });
    return;
  }

  try {
    const existingMember = await prisma.teamMember.findUnique({
      where: { id: teamMemberId },
    });

    if (!existingMember) {
      res.status(404).json({ success: false, message: "Team member not found" });
      return;
    }

    let newRole: Role;
    if (existingMember.role === Role.team_member) {
      newRole = Role.sub_admin;
    } else if (existingMember.role === Role.sub_admin) {
      newRole = Role.team_member;
    } else {
      res.status(400).json({ success: false, message: "Invalid role to toggle" });
      return;
    }

    const updatedMember = await prisma.teamMember.update({
      where: { id: teamMemberId },
      data: { role: newRole },
    });

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: updatedMember,
    });
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        res.status(404).json({ success: false, message: "Team member not found" });
        return;
      }
      if (err.code === "P2003") {
        res.status(400).json({ success: false, message: "Invalid scope or foreign key" });
        return;
      }
    }

    console.error("updateTeamRole error:", err);
    if (!res.headersSent) {
      next(err);
    } else {
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
};
