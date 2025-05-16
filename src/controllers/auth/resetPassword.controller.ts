// src/controllers/auth/resetPassword.controller.ts
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { prisma, env } from "../../config/database.config";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../core/utils/httpResponse";

const SALT_ROUNDS = parseInt(env.SALT_ROUNDS ?? "12", 10);

export const resetPassword = async (
  req: Request<{}, {}, { oldPassword: string; newPassword: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user;
  if (!user) {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }

  const userId = user.id;
  const adminId = user.role === "admin" ? user.id : user.adminId;

  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    sendErrorResponse(
      res,
      400,
      "Both oldPassword and newPassword are required"
    );
    return;
  }

  try {
    // 1) Fetch login credentials
    const credential = await prisma.loginCredential.findFirst({
      where: { userProfileId: userId, adminId,  status: true },
    });
    if (!credential || !credential.passwordHash) {
      sendErrorResponse(res, 404, "Credential not found");
      return;
    }

    // 2) Validate old password
    const isMatch = await bcrypt.compare(oldPassword, credential.passwordHash);
    if (!isMatch) {
      sendErrorResponse(res, 401, "Incorrect old password");
      return;
    }

    // 3) Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // 4) Transaction: Update login credentials and profile table
    await prisma.$transaction(async (tx) => {
      // Update loginCredential
      await tx.loginCredential.updateMany({
        where: { userProfileId: userId, adminId },
        data: { passwordHash },
      });

      // Update role-specific table
      switch (user.role) {
        case "super_admin":
          await tx.superAdmin.update({
            where: { id: userId },
            data: { passwordHash },
          });
          break;
        case "admin":
          await tx.admin.update({
            where: { id: userId },
            data: { passwordHash },
          });
          break;
        case "partner":
          await tx.partner.update({
            where: { id: userId, adminId },
            data: { passwordHash },
          });
          break;
        case "team_member":
        case "sub_admin":
          await tx.teamMember.update({
            where: { id: userId, adminId },
            data: { passwordHash },
          });
          break;
        default:
          throw new Error("Unsupported role");
      }
    });

    sendSuccessResponse(res, 200, "Password updated successfully");
  } catch (err) {
    console.error("resetPassword error:", err);
    sendErrorResponse(res, 500, "Server error");
  }
};
