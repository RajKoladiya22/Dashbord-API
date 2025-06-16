// src/controllers/auth/forgotPassword.controller.ts
import { Request, Response, NextFunction } from "express";
import { prisma, env } from "../../config/database.config";
import { sendSuccessResponse, sendErrorResponse } from "../../core/utils/httpResponse";
import crypto from "crypto";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";

const SALT_ROUNDS = parseInt(env.SALT_ROUNDS ?? "12", 10);

const mailtransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "magicallydev@gmail.com",
    pass: "vkdd frwe seja frlb", // Consider using env vars instead
  },
});

export const forgotPassword = async (
  req: Request<{}, {}, { email: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const rawEmail = req.body.email;
  const email = rawEmail?.trim().toLowerCase();

  if (!email) {
    sendErrorResponse(res, 400, "Email is required");
    return;
  }

  try {
    // 1) Lookup loginCredential
    const cred = await prisma.loginCredential.findUnique({
      where: { email, status: true },
      select: { userProfileId: true, role: true },
    });

    // Always return success to avoid exposing existence of email
    if (!cred) {
      sendSuccessResponse(res, 200, "If that account exists, an OTP has been sent");
      return;
    }

    // 2) Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // 3) Save OTP in DB
    await prisma.passwordOtp.create({
      data: {
        userId: cred.userProfileId,
        otp,
        purpose: "forgot_password",
        used: false,
      },
    });

    // 4) Send OTP via email
    await mailtransport.sendMail({
      from: `"MagicallySoft" <magicallydev@gmail.com>`,
      to: email,
      subject: "Password Reset OTP",
      html: `
        <p>Hi,</p>
        <p>Your OTP for resetting the password is: <strong>${otp}</strong></p>
        <p>This OTP is valid for the next 15 minutes.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
        <br/>
        <p>Regards,<br/>MagicallySoft Team</p>
      `,
    });

    sendSuccessResponse(res, 200, "If that account exists, an OTP has been sent");
  } catch (err) {
    console.error("forgotPassword error:", err);
    sendErrorResponse(res, 500, "Server error");
  }
};


export const UpdatePassword = async (
  req: Request<{}, {}, { email: string; otp: string; newPassword: string }>,
  res: Response,
  next: NextFunction
) => {
  const email = req.body.email?.toLowerCase().trim();
  const { otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    sendErrorResponse(res, 400, "Email, OTP, and new password are required");
    return;
  }

  try {
    // 1. Find LoginCredential
    const cred = await prisma.loginCredential.findUnique({
      where: { email },
      select: {
        id: true,
        passwordHash: true,
        role: true,
        userProfileId: true,
      },
    });

    if (!cred) {
      sendErrorResponse(res, 400, "Invalid email or OTP");
      return;
    }

    // 2. Find OTP entry (must not be used or expired)
    const otpEntry = await prisma.passwordOtp.findFirst({
      where: {
        userId: cred.userProfileId,
        otp,
        purpose: "forgot_password",
        used: false,
        createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) }, // 15 min validity
      },
    });

    if (!otpEntry) {
      sendErrorResponse(res, 400, "Invalid or expired OTP");
      return;
    }

    // 3. Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // 4. Update LoginCredential & corresponding user table
    await prisma.$transaction(async (tx) => {
      await tx.loginCredential.update({
        where: { email },
        data: { passwordHash },
      });

      switch (cred.role) {
        case "super_admin":
          await tx.superAdmin.update({
            where: { id: cred.userProfileId },
            data: { passwordHash },
          });
          break;
        case "admin":
          await tx.admin.update({
            where: { id: cred.userProfileId },
            data: { passwordHash },
          });
          break;
        case "partner":
          await tx.partner.update({
            where: { id: cred.userProfileId },
            data: { passwordHash },
          });
          break;
        case "team_member":
        case "sub_admin":
          await tx.teamMember.update({
            where: { id: cred.userProfileId },
            data: { passwordHash },
          });
          break;
        default:
          throw new Error("Unsupported role");
      }

      // Mark OTP as used
      await tx.passwordOtp.update({
        where: { id: otpEntry.id },
        data: { used: true },
      });
    });

    sendSuccessResponse(res, 200, "Password reset successful");
  } catch (err) {
    console.error("resetPassword error:", err);
    sendErrorResponse(res, 500, "Server error");
  }
};