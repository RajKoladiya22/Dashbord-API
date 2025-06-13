// src/controllers/auth/auth.controller.ts

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { addDays } from "date-fns";
import { prisma, env } from "../../config/database.config";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../core/utils/httpResponse";
import {
  generateToken,
  setAuthCookie,
} from "../../core/middleware/jwt/jwt.token";
import {
  signInSchema,
  signUpSchema,
  signUpSuperAdminSchema,
} from "../../core/utils/zod";

const SALT_ROUNDS = parseInt(env.SALT_ROUNDS ?? "12", 10);

// ── ADMIN SIGN-UP ───────────────────────────────────────────────────────────────
export const signUpAdmin = async (
  req: Request<{}, {}, z.infer<typeof signUpSchema>>,
  res: Response,
  next: NextFunction
) => {
  const parsed = signUpSchema.safeParse(req.body);
  if (!parsed.success) {
    sendErrorResponse(res, 400, "Invalid input", {
      errors: parsed.error.errors,
    });
    return;
  }
  const {
    firstName,
    lastName,
    email,
    password,
    contactNumber,
    companyName,
    address,
  } = parsed.data;

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const admin = await prisma.$transaction(async (tx) => {
      // create admin profile
      const a = await tx.admin.create({
        data: {
          firstName,
          lastName,
          email,
          passwordHash,
          companyName,
          contactInfo: { contactNumber },
          address,
          role: "admin", 
        },
        select: {
          id: true,
          role: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      await tx.loginCredential.create({
        data: {
          role: "admin",
          email: a.email,
          passwordHash,
          userProfileId: a.id,
          adminId: a.id,
        },
      });

      // fetch default “Basic” plan
      const plan = await tx.plan.findFirst({
        where: { name: "Basic", duration: "30 days" },
      });
      if (!plan) throw new Error("Default plan not found");

      // create subscription
      const startsAt = new Date();
      // const endsAt = new Date(startsAt.getTime() + 30 * 24 * 3600 * 1000);
      const endsAt = addDays(startsAt, 30);
      await tx.subscription.create({
        data: {
          adminId: a.id,
          planId: plan.id,
          status: "active",
          startsAt,
          endsAt,
        },
      });

      return a;
    });

    // generate token & cookie
    const token = generateToken(admin.id, admin.role, admin.id);
    setAuthCookie(res, token);

    sendSuccessResponse(res, 201, "Admin account created", {
      token,
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        firstName: admin.firstName,
        lastName: admin.lastName,
      },
    });
    return;
  } catch (err: any) {
    console.error("signUpAdmin error:", err);
    if (err.code === "P2002") {
      // unique constraint violation
      sendErrorResponse(res, 409, "Email already in use");
      return;
    }
    sendErrorResponse(res, 500, "Server error");
    return;
  }
};

// ── SUPER-ADMIN SIGN-UP ────────────────────────────────────────────────────────

export const signUpSuperAdmin = async (
  req: Request<{}, {}, z.infer<typeof signUpSuperAdminSchema>>,
  res: Response,
  next: NextFunction  
) => {
  const parsed = signUpSuperAdminSchema.safeParse(req.body);
  if (!parsed.success) {
    sendErrorResponse(res, 400, "Invalid input", {
      errors: parsed.error.errors,
    });
    return;
  }
  const { firstName, lastName, email, password, contactNumber, address } =
    parsed.data;

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const superAdmin = await prisma.$transaction(async (tx) => {
      // create super_admin profile
      const sa = await tx.superAdmin.create({
        data: {
          firstName,
          lastName,
          email,
          passwordHash,
          contactInfo: contactNumber ? { contactNumber } : undefined,
          address,
        },
        select: { id: true, email: true },
      });
      // create its login credential
      await tx.loginCredential.create({
        data: {
          role: "super_admin",
          email: sa.email,
          passwordHash,
          userProfileId: sa.id,
          superAdminId: sa.id,
        },
      });
      return sa;
    });

    const token = generateToken(superAdmin.id, "super_admin", superAdmin.id);
    setAuthCookie(res, token);

    sendSuccessResponse(res, 201, "Super‑admin registered", {
      token,
      user: { id: superAdmin.id, email: superAdmin.email, role: "super_admin" },
    });
    return;
  } catch (err: any) {
    console.error("registerSuperAdmin error:", err);
    if (err.code === "P2002") {
      sendErrorResponse(res, 409, "Email already in use");
      return;
    }
    sendErrorResponse(res, 500, "Server error");
    return;
  }
};

// ── SIGN-IN (ANY ROLE) ─────────────────────────────────────────────────────────
export const signIn = async (
  req: Request<{}, {}, z.infer<typeof signInSchema>>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // validate
  const parsed = signInSchema.safeParse(req.body);
  if (!parsed.success) {
    sendErrorResponse(res, 400, "Email and password are required");
    return;
  }
  const { identifier: email, password } = parsed.data;

  try {
    // fetch credential row
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
    
    // timing‑safe compare
    const dummyHash = "$2b$12$........................................";
    if (!cred) {
      // do a dummy compare to keep timing consistent
      await bcrypt.compare(password, dummyHash);
      sendErrorResponse(res, 401, "Invalid credentials");
      return;
    }

    const match = await bcrypt.compare(
      password,
      cred?.passwordHash || dummyHash
    );
    if (!cred || !match || cred.status !== true || !cred.userProfileId) {
      sendErrorResponse(res, 401, "Invalid credentials");
      return; 
    }

    const now = new Date();

    // for non‑super_admin, check subscription
    if (cred.role !== "super_admin") {
      const sub = await prisma.subscription.findFirst({
        where: {
          adminId: cred.adminId!,
          status: "active",
          endsAt: { gt: now },
        },
        orderBy: { endsAt: "desc" },
      });
      if (!sub) {
        sendErrorResponse(res, 403, "No active subscription");
        return;
      }
    }

    // console.log("cred----->", cred)
    // fetch profile by role
    let profile: any = null;
    switch (cred.role) {
      case "super_admin":
        profile = await prisma.superAdmin.findUnique({
          where: { id: cred.userProfileId },
          select: { id: true, firstName: true, lastName: true },
        });
        break;
      case "admin":
        profile = await prisma.admin.findUnique({
          where: { id: cred.userProfileId },
          select: { id: true, firstName: true, lastName: true, role: true },
        });
        break;
      case "partner":
        profile = await prisma.partner.findUnique({
          where: { id: cred.userProfileId },
          select: { id: true, firstName: true, lastName: true, role: true },
        });
        break;
      case "team_member":
      case "sub_admin":
        profile = await prisma.teamMember.findUnique({
          where: { id: cred.userProfileId },
          select: { id: true, firstName: true, lastName: true, role: true },
        });
        break;
      default:
        sendErrorResponse(res, 403, "Unsupported role");
        return;
    }


    // console.log("profile---->", profile)
    if (!profile) {
      sendErrorResponse(res, 500, "User profile missing");
      return;
    }

    // generate & set JWT
    const token = generateToken(
      cred.userProfileId,
      cred.role,
      cred.adminId || cred.userProfileId
    );
    setAuthCookie(res, token);

    // respond
    sendSuccessResponse(res, 200, "Logged in", {
      token,
      user: {
        id: profile.id,
        email,
        role: cred.role,
        firstName: profile.firstName,
        lastName: profile.lastName,
      },
    });
    return;
  } catch (err) {
    console.error("signIn error:", err);
    sendErrorResponse(res, 500, "Server error");
    return;
  }
};
