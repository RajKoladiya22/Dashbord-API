// src/controllers/auth/auth.controller.ts

import { Request, Response, NextFunction } from "express";
import { prisma, env } from "../../config/database.config";
import bcrypt from "bcrypt";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../core/utils/httpResponse";
import {
  generateToken,
  setAuthCookie,
} from "../../core/middleware/jwt/jwt.token";
import { signInSchema, signUpSchema } from "../../core/utils/zod";
import { z } from "zod";

const SALT_ROUNDS = parseInt(env.SALT_ROUNDS ?? "12", 10);

// ── Sign-In Handler ────────────────────────────────────────────────────────────
export const signIn = async (
  req: Request<{}, {}, z.infer<typeof signInSchema>>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // 0) Validate input
  const parsed = signInSchema.safeParse(req.body);
  if (!parsed.success) {
    sendErrorResponse(res, 400, "Email and password are required");
    return;
  }
  const { identifier: email, password } = parsed.data;

  try {
    // 1) Fetch credential
    const now = new Date();
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

    // 2) Always compare against a hash to mitigate timing attacks
    const dummyHash = "$2b$12$........................................";
    const match = await bcrypt.compare(
      password,
      cred?.passwordHash || dummyHash
    );
    if (!cred || !match || cred.status !== "active" || !cred.adminId) {
      sendErrorResponse(res, 401, "Invalid credentials");
      return;
    }

    // 3) Parallel fetch subscription + profile
    const [subscription, userProfile] = await Promise.all([
      prisma.subscription.findFirst({
        where: {
          adminId: cred.adminId,
          status: "active",
          endsAt: { gt: now },
        },
        select: { id: true },
        orderBy: { endsAt: "desc" },
      }),
      (async () => {
        if (cred.role === "admin") {
          return prisma.admin.findUnique({
            where: { id: cred.userProfileId },
            select: { id: true, firstName: true, lastName: true, role: true },
          });
        } else if (cred.role === "partner") {
          return prisma.partner.findUnique({
            where: { id: cred.userProfileId },
            select: { id: true, firstName: true, lastName: true, role: true },
          });
        } else {
          return prisma.teamMember.findUnique({
            where: { id: cred.userProfileId },
            select: { id: true, firstName: true, lastName: true, role: true },
          });
        }
      })(),
    ]);

    if (!subscription) {
      sendErrorResponse(res, 403, "No active subscription");
      return;
    }
    if (!userProfile) {
      sendErrorResponse(res, 500, "User profile missing");
      return;
    }
    // 4) Issue token & set secure cookie
    const token = generateToken(cred.userProfileId, cred.role, cred.adminId);
    setAuthCookie(res, token);

    // 8) Success
    sendSuccessResponse(res, 200, "Logged in", {
      token,
      user: {
        id: userProfile.id,
        email,
        role: userProfile.role,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
      },
    });
    return;
  } catch (err) {
    console.error("Login Error:", err);
    sendErrorResponse(res, 500, "Server error");
    next(err);
  }
};
// export const signIn = async (
//   req: Request<{}, {}, z.infer<typeof signInSchema>>,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   // 1) Validate input
//   const parsed = signInSchema.safeParse(req.body);
//   if (!parsed.success) {
//     sendErrorResponse(res, 400, "Email and password are required");
//     return;
//   }
//   const { identifier: email, password } = parsed.data;

//   try {
//     // 2) In one round‑trip, fetch credential, subscription flag, and profile
//     const now = new Date();
//     const [cred] = await prisma.$transaction([
//       prisma.loginCredential.findUnique({
//         where: { email },
//         select: {
//           passwordHash: true,
//           role: true,
//           adminId: true,
//           userProfileId: true,
//           status: true,
//         },
//       }),
//     ]);

//     // 2.1) Validate credential
//     if (
//       !cred ||
//       cred.status !== "active" ||
//       !cred.adminId ||
//       !cred.userProfileId
//     ) {
//       sendErrorResponse(res, 401, "Invalid credentials");
//       return;
//     }

//     // 3)
//     const subscription = await  prisma.subscription.findFirst({
//       where: {
//         adminId: cred.adminId, // placeholder—adjust below
//         status: "active",
//         endsAt: { gt: now },
//       },
//       select: { id: true },
//       orderBy: { endsAt: "desc" },
//     });

//     // 4) Verify password
//     const match = await bcrypt.compare(password, cred.passwordHash);
//     if (!match) {
//       sendErrorResponse(res, 401, "Invalid credentials");
//       return;
//     }

//     // 5) Check subscription
//     if (!subscription) {
//       sendErrorResponse(res, 403, "No active subscription");
//       return;
//     }

//     // 6) Fetch correct profile by role
//     let userProfile;
//     if (cred.role === "admin") {
//       userProfile = await prisma.admin.findUnique({
//         where: { id: cred.userProfileId },
//         select: { id: true, firstName: true, lastName: true, role: true },
//       });
//     } else if (cred.role === "partner") {
//       userProfile = await prisma.partner.findUnique({
//         where: { id: cred.userProfileId },
//         select: { id: true, firstName: true, lastName: true, role: true },
//       });
//     } else {
//       userProfile = await prisma.teamMember.findUnique({
//         where: { id: cred.userProfileId },
//         select: { id: true, firstName: true, lastName: true, role: true },
//       });
//     }
//     if (!userProfile) {
//       sendErrorResponse(res, 500, "User profile missing");
//       return;
//     }

//     // 7) Issue JWT & set cookie
//     const token = generateToken(cred.userProfileId, cred.role, cred.adminId!);
//     setAuthCookie(res, token);

//     // 8) Success
//     sendSuccessResponse(res, 200, "Logged in", {
//       token,
//       user: {
//         id: userProfile.id,
//         email,
//         role: userProfile.role,
//         firstName: userProfile.firstName,
//         lastName: userProfile.lastName,
//       },
//     });
//     return;
//   } catch (err) {
//     console.error("Login Error:", err);
//     sendErrorResponse(res, 500, "Server error");
//     next(err);
//   }
// };

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
    // Atomic create of Admin + initial Subscription
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await prisma.$transaction(async (tx) => {
      const admin = await tx.admin.create({
        data: {
          firstName,
          lastName,
          email,
          passwordHash: hashed,
          companyName,
          contactInfo: { contactNumber },
          address,
          status: "active",
          role: "admin",
        },
        select: { id: true, role: true, email: true },
      });
      await tx.subscription.create({
        data: {
          adminId: admin.id,
          planId: "5987d07c-bbe5-4f93-b87a-bb8907b36244",
          status: "active",
          startsAt: new Date(),
          endsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        },
      });
      return admin;
    });

    const token = generateToken(result.id, result.role, result.id);
    setAuthCookie(res, token);

    sendSuccessResponse(res, 201, "Account created", {
      token,
      user: { id: result.id, email: result.email, role: result.role },
    });
  } catch (err) {
    console.error("Sign-up Error:", err);
    sendErrorResponse(res, 500, "Server error");
    next(err);
  }
};
