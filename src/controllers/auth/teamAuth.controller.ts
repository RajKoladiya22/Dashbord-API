// src/controllers/auth/teamAuth.controller.ts

import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.config";
import bcrypt from "bcrypt";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../core/utils/httpResponse";

// ── Create TeamMember Handler ────────────────────────────────────────────────────────────
export const createTeamMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. Validate input
  const { full_name, email, password, department, position } = req.body;

  try {
    // 2. Interactive transaction
    const teamMember = await prisma.$transaction(async (tx) => {
      if (req.user?.role !== "admin") {
        sendErrorResponse(res, 403, "Only admins can create partners.");
        return;
      }
      const adminId = req.user?.id;
      const [firstName, ...rest] = full_name.trim().split(" ");
      const lastName = rest.join(" ") || "";
      // 2a. Check email uniqueness
      const exists = await tx.teamMember.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (exists) {
        throw new Error("Email already in use.");
      }

      // 2b. Hash password
      const saltRounds = parseInt(process.env.SALT_ROUNDS ?? "10", 10);
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // 2c. Create the TeamMember record
      return tx.teamMember.create({
        data: {
          adminId,
          firstName,
          lastName,
          email: email.toLowerCase(),
          passwordHash,
          department,
          position,
          status: "active",
          role: "team_member", // explicit even though default covers it
        },
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
    });

    // 3. Send response
    sendSuccessResponse(res, 201, "Team member created", { teamMember });
  } catch (error: any) {
    console.error("createTeamMember error:", error);
    // If we threw our uniqueness Error, map to 409
    if (error.message === "Email already in use.") {
      sendErrorResponse(res, 409, error.message);
    } else {
      sendErrorResponse(res, 500, "Server error");
    }
    next(error);
  }
};
