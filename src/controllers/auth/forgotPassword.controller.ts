// src/controllers/auth/forgotPassword.controller.ts
import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.config";
import { sendSuccessResponse, sendErrorResponse } from "../../core/utils/httpResponse";
import crypto from "crypto";

export const forgotPassword = async (
  req: Request<{}, {}, { email: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email } = req.body;
  if (!email) {
      sendErrorResponse(res, 400, "Email is required");
      return;
  }

  try {
    // 1) Find credential to get userProfileId & role
    const cred = await prisma.loginCredential.findUnique({
      where: { email: email.toLowerCase(), status: true },
      select: { userProfileId: true, role: true }
    });
    if (!cred) {
      // avoid leaking which emails exist
      sendSuccessResponse(res, 200, "If that account exists, an OTP has been sent");
      return;
    }

    // 2) Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // 3) Store in PasswordOtp table (expires after 15 min by TTL in DB or via a background cleanup)
    await prisma.passwordOtp.create({
      data: {
        userId: cred.userProfileId,
        otp,
        purpose: "forgot_password",
        used: false,
      }
    });

    // 4) TODO: send OTP via email/SMS using your mailer service
    // await mailer.sendPasswordOtp(email, otp);

    sendSuccessResponse(res, 200, "If that account exists, an OTP has been sent");
  } catch (err) {
    console.error("forgotPassword error:", err);
    sendErrorResponse(res, 500, "Server error");
  }
};
