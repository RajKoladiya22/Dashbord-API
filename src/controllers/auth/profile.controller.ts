// src/controllers/auth/profile.controller.ts
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { prisma, env } from "../../config/database.config";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../core/utils/httpResponse";

const SALT_ROUNDS = parseInt(env.SALT_ROUNDS ?? "12", 10);

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user;
  if (!user) {
    sendErrorResponse(res, 401, 'Unauthorized');
    return;
  }

  try {
    let profile;

    switch (user.role) {
      case 'super_admin':
        profile = await prisma.superAdmin.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            contactInfo: true,
            address: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        break;
      case 'admin':
        profile = await prisma.admin.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            contactInfo: true,
            address: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        break;
      case 'partner':
        profile = await prisma.partner.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            contactInfo: true,
            address: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        break;
      case 'team_member':
      case 'sub_admin':
        profile = await prisma.teamMember.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            contactInfo: true,
            address: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        break;
      default:
        sendErrorResponse(res, 400, 'Invalid user role');
        return;
    }

    if (!profile) {
      sendErrorResponse(res, 404, 'Profile not found');
      return;
    }

    sendSuccessResponse(res, 200, 'Profile retrieved successfully', { profile });
  } catch (err: any) {
    console.error('getProfile error:', err);
    sendErrorResponse(res, 500, 'Server error');
  }
};

export const updateProfile = async (
  req: Request<
    {},
    {},
    {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
      contactInfo?: any;
      address?: any;
    }
  >,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user;
  if (!user) {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }
  const adminId = user.role === "admin" ? user.id : user.adminId!;

  const { firstName, lastName, email, password, contactInfo, address } =
    req.body;

  try {
    // 1) Hash new password if provided
    let passwordHash: string | undefined;
    if (password) {
      passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    // 2) Prepare data payload
    const updateData: any = {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(contactInfo !== undefined && { contactInfo }),
      ...(address !== undefined && { address }),
    };

    // 3) Update both profile and loginCredential if email/password changed
    const result = await prisma.$transaction(async (tx) => {
      let updatedProfile;
      switch (user.role) {
        case "super_admin":
          updatedProfile = await tx.superAdmin.update({
            where: { id: user.id },
            data: {
              ...updateData,
              ...(email && { email }),
              ...(passwordHash && { passwordHash }),
            },
          });
          break;
        case "admin":
          updatedProfile = await tx.admin.update({
            where: { id: user.id },
            data: {
              ...updateData,
              ...(email && { email }),
              ...(passwordHash && { passwordHash }),
            },
          });
          break;
        case "partner":
          updatedProfile = await tx.partner.update({
            where: { id: user.id,  status: true },
            data: {
              ...updateData,
              ...(email && { email }),
              ...(passwordHash && { passwordHash }),
            },
          });
          break;
        case "team_member":
        case "sub_admin":
          updatedProfile = await tx.teamMember.update({
            where: { id: user.id,  status: true },
            data: {
              ...updateData,
              ...(email && { email }),
              ...(passwordHash && { passwordHash }),
            },
          });
          break;
        default:
          throw new Error("Unsupported role");
      }

      // 3b) Mirror into loginCredential if email or password changed
      if (email || passwordHash) {
        const cred = await tx.loginCredential.findFirst({
            where: { userProfileId: user.id, adminId },
            select: { id: true },
          });
          if (cred) {
            await tx.loginCredential.update({
              where: { id: cred.id },    // now a unique field
              data: { ...(email && { email }), ...(passwordHash && { passwordHash }) },
            });
          }
      }

      return updatedProfile;
    });

    sendSuccessResponse(res, 200, "Profile updated", { data: result });
  } catch (err: any) {
    console.error("updateProfile error:", err);
    sendErrorResponse(
      res,
      err.code === "P2002" ? 409 : 500,
      err.message || "Server error"
    );
  }
};
