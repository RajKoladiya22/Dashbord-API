// src/controllers/auth/auth.controller.ts

import { Request, Response, NextFunction } from "express";
import { prisma, env } from "../../config/database.config";
import bcrypt from "bcrypt";
import { sendSuccessResponse, sendErrorResponse } from "../../core/utils/httpResponse";
import { generateToken, setAuthCookie } from "../../core/middleware/jwt/jwt.token";
import { signInSchema, signUpSchema } from "../../core/utils/zod";
import { z } from "zod";

const SALT_ROUNDS = parseInt(env.SALT_ROUNDS ?? "12", 10);



// ── Sign-In Handler ────────────────────────────────────────────────────────────
export const signIn = async (
  req: Request<{}, {}, z.infer<typeof signInSchema>>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // 1) Validate input
  const parsed = signInSchema.safeParse(req.body);
  if (!parsed.success) {
    sendErrorResponse(res, 400, "Invalid input");
    return;
  }
  const { identifier: email, password } = parsed.data;

  try {
    // 2) Fetch login credentials
    const cred = await prisma.loginCredential.findUnique({
      where: { email },
      select: {
        passwordHash: true,
        role: true,
        adminId: true,
        userProfileId: true,
        status: true,
      },
    });
    if (!cred || cred.status !== "active" || !cred.adminId) {
      sendErrorResponse(res, 401, "Invalid credentials");
      return;
    }

    // 3) Verify password
    const match = await bcrypt.compare(password, cred.passwordHash);
    if (!match) {
      sendErrorResponse(res, 401, "Invalid credentials");
      return;
    }

    // 4) Check for an active subscription (filter by adminId!)
    const subscription = await prisma.subscription.findFirst({
      where: {
        adminId: cred.adminId,
        status: "active",
        endsAt: { gt: new Date() },
      },
      orderBy: { endsAt: "desc" },
      select: { id: true },
    });
    // console.log("subscription--->", subscription);
    
    if (!subscription) {
      sendErrorResponse(res, 403, "No active subscription");
      return;
    }

    // 5) Optionally fetch admin details if needed
    const admin = await prisma.admin.findUnique({
      where: { id: cred.adminId },
      select: { id: true, firstName: true, role: true, lastName: true },
    });
    if (!admin) {
      sendErrorResponse(res, 500, "Admin record missing");
      return;
    }

    // 6) Issue JWT and set cookie
    const token = generateToken(cred.userProfileId, cred.role, cred.adminId);
    setAuthCookie(res, token);  // secure flags in middleware

    // 7) Return success
    sendSuccessResponse(res, 200, "Logged in", {
      token,
      user: {
        id: admin.id,
        email,
        role: admin.role,
        username: admin.firstName,
        firstName: admin.firstName,
        lastName: admin.lastName
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    sendErrorResponse(res, 500, "Server error");
    next(err);
  }
};


// ── Sign-Up Handler ────────────────────────────────────────────────────────────
export const signUp = async (
  req: Request<{}, {}, z.infer<typeof signUpSchema>>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const parsed = signUpSchema.safeParse(req.body);
  if (!parsed.success) {
    sendErrorResponse(res, 400, "Invalid input");
    return;
  }
  const { firstName, lastName, email, password, contactNumber, companyName, address } = parsed.data;

  try {
    // Atomic create of Admin + initial Subscription
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);  
    const result = await prisma.$transaction(async (tx) => {
      const admin = await tx.admin.create({
        data: {
          firstName, lastName, email,
          passwordHash: hashed,
          companyName,
          contactInfo: { contactNumber },
          address,
          status: "active", role: "admin"
        },
        select: { id: true, role: true, email: true }
      });
      await tx.subscription.create({
        data: {
          adminId: admin.id,
          planId: "41cf83f7-2d28-430a-82ac-813d0a489aab",
          status: "active",
          startsAt: new Date(),
          endsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000)
        }
      });
      return admin;
    });

    const token = generateToken(result.id, result.role, result.id);
    setAuthCookie(res, token);

    sendSuccessResponse(res, 201, "Account created", {
      token,
      user: { id: result.id, email: result.email, role: result.role }
    });
  } catch (err) {
    console.error("Sign-up Error:", err);
    sendErrorResponse(res, 500, "Server error");
    next(err);
  }
};
