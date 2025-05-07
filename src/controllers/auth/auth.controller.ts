// // src/controllers/auth/auth.controller.ts

// import { Request, Response, NextFunction } from "express";
// import { prisma, env } from "../../config/database.config";
// import bcrypt from "bcrypt";
// import {
//   sendSuccessResponse,
//   sendErrorResponse,
// } from "../../core/utils/httpResponse";
// import {
//   generateToken,
//   setAuthCookie,
// } from "../../core/middleware/jwt/jwt.token";
// import { signInSchema, signUpSchema } from "../../core/utils/zod";
// import { z } from "zod";

// const SALT_ROUNDS = parseInt(env.SALT_ROUNDS ?? "12", 10);

// // ── Sign-In Handler ────────────────────────────────────────────────────────────
// export const signIn = async (
//   req: Request<{}, {}, z.infer<typeof signInSchema>>,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   // 0) Validate input
//   const parsed = signInSchema.safeParse(req.body);
//   if (!parsed.success) {
//     sendErrorResponse(res, 400, "Email and password are required");
//     return;
//   }
//   const { identifier: email, password } = parsed.data;

//   try {
//     // 1) Fetch credential
//     const now = new Date();
//     const cred = await prisma.loginCredential.findUnique({
//       where: { email },
//       select: {
//         passwordHash: true,
//         role: true,
//         adminId: true,
//         userProfileId: true,
//         status: true,
//       },
//     });

//     // 2) Always compare against a hash to mitigate timing attacks
//     const dummyHash = "$2b$12$........................................";
//     const match = await bcrypt.compare(
//       password,
//       cred?.passwordHash || dummyHash
//     );
//     if (!cred || !match || cred.status !== "active" || !cred.adminId) {
//       sendErrorResponse(res, 401, "Invalid credentials");
//       return;
//     }

//     // 3) Parallel fetch subscription + profile
//     const [subscription, userProfile] = await Promise.all([
//       prisma.subscription.findFirst({
//         where: {
//           adminId: cred.adminId,
//           status: "active",
//           endsAt: { gt: now },
//         },
//         select: { id: true },
//         orderBy: { endsAt: "desc" },
//       }),
//       (async () => {
//         if (cred.role === "admin") {
//           return prisma.admin.findUnique({
//             where: { id: cred.userProfileId },
//             select: { id: true, firstName: true, lastName: true, role: true },
//           });
//         } else if (cred.role === "partner") {
//           return prisma.partner.findUnique({
//             where: { id: cred.userProfileId },
//             select: { id: true, firstName: true, lastName: true, role: true },
//           });
//         } else {
//           return prisma.teamMember.findUnique({
//             where: { id: cred.userProfileId },
//             select: { id: true, firstName: true, lastName: true, role: true },
//           });
//         }
//       })(),
//     ]);

//     if (!subscription) {
//       sendErrorResponse(res, 403, "No active subscription");
//       return;
//     }
//     if (!userProfile) {
//       sendErrorResponse(res, 500, "User profile missing");
//       return;
//     }
//     // 4) Issue token & set secure cookie
//     const token = generateToken(cred.userProfileId, cred.role, cred.adminId);
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
// // export const signIn = async (
// //   req: Request<{}, {}, z.infer<typeof signInSchema>>,
// //   res: Response,
// //   next: NextFunction
// // ): Promise<void> => {
// //   // 1) Validate input
// //   const parsed = signInSchema.safeParse(req.body);
// //   if (!parsed.success) {
// //     sendErrorResponse(res, 400, "Email and password are required");
// //     return;
// //   }
// //   const { identifier: email, password } = parsed.data;

// //   try {
// //     // 2) In one round‑trip, fetch credential, subscription flag, and profile
// //     const now = new Date();
// //     const [cred] = await prisma.$transaction([
// //       prisma.loginCredential.findUnique({
// //         where: { email },
// //         select: {
// //           passwordHash: true,
// //           role: true,
// //           adminId: true,
// //           userProfileId: true,
// //           status: true,
// //         },
// //       }),
// //     ]);

// //     // 2.1) Validate credential
// //     if (
// //       !cred ||
// //       cred.status !== "active" ||
// //       !cred.adminId ||
// //       !cred.userProfileId
// //     ) {
// //       sendErrorResponse(res, 401, "Invalid credentials");
// //       return;
// //     }

// //     // 3)
// //     const subscription = await  prisma.subscription.findFirst({
// //       where: {
// //         adminId: cred.adminId, // placeholder—adjust below
// //         status: "active",
// //         endsAt: { gt: now },
// //       },
// //       select: { id: true },
// //       orderBy: { endsAt: "desc" },
// //     });

// //     // 4) Verify password
// //     const match = await bcrypt.compare(password, cred.passwordHash);
// //     if (!match) {
// //       sendErrorResponse(res, 401, "Invalid credentials");
// //       return;
// //     }

// //     // 5) Check subscription
// //     if (!subscription) {
// //       sendErrorResponse(res, 403, "No active subscription");
// //       return;
// //     }

// //     // 6) Fetch correct profile by role
// //     let userProfile;
// //     if (cred.role === "admin") {
// //       userProfile = await prisma.admin.findUnique({
// //         where: { id: cred.userProfileId },
// //         select: { id: true, firstName: true, lastName: true, role: true },
// //       });
// //     } else if (cred.role === "partner") {
// //       userProfile = await prisma.partner.findUnique({
// //         where: { id: cred.userProfileId },
// //         select: { id: true, firstName: true, lastName: true, role: true },
// //       });
// //     } else {
// //       userProfile = await prisma.teamMember.findUnique({
// //         where: { id: cred.userProfileId },
// //         select: { id: true, firstName: true, lastName: true, role: true },
// //       });
// //     }
// //     if (!userProfile) {
// //       sendErrorResponse(res, 500, "User profile missing");
// //       return;
// //     }

// //     // 7) Issue JWT & set cookie
// //     const token = generateToken(cred.userProfileId, cred.role, cred.adminId!);
// //     setAuthCookie(res, token);

// //     // 8) Success
// //     sendSuccessResponse(res, 200, "Logged in", {
// //       token,
// //       user: {
// //         id: userProfile.id,
// //         email,
// //         role: userProfile.role,
// //         firstName: userProfile.firstName,
// //         lastName: userProfile.lastName,
// //       },
// //     });
// //     return;
// //   } catch (err) {
// //     console.error("Login Error:", err);
// //     sendErrorResponse(res, 500, "Server error");
// //     next(err);
// //   }
// // };

// // ── Sign-Up Handler ────────────────────────────────────────────────────────────

// // export const signUp = async (
// //   req: Request<{}, {}, z.infer<typeof signUpSchema>>,
// //   res: Response,
// //   next: NextFunction
// // ): Promise<void> => {
// //   const parsed = signUpSchema.safeParse(req.body);
// //   if (!parsed.success) {
// //     sendErrorResponse(res, 400, "Invalid input");
// //     return;
// //   }
// //   const {
// //     firstName,
// //     lastName,
// //     email,
// //     password,
// //     contactNumber,
// //     companyName,
// //     address,
// //   } = parsed.data;

// //   try {
// //     // Atomic create of Admin + initial Subscription
// //     const hashed = await bcrypt.hash(password, SALT_ROUNDS);
// //     const result = await prisma.$transaction(async (tx) => {
// //       const admin = await tx.admin.create({
// //         data: {
// //           firstName,
// //           lastName,
// //           email,
// //           passwordHash: hashed,
// //           companyName,
// //           contactInfo: { contactNumber },
// //           address,
// //           status: "active",
// //           role: "admin",
// //         },
// //         select: { id: true, role: true, email: true },
// //       });
// //       await tx.subscription.create({
// //         data: {
// //           adminId: admin.id,
// //           planId: "5987d07c-bbe5-4f93-b87a-bb8907b36244",
// //           status: "active",
// //           startsAt: new Date(),
// //           endsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
// //         },
// //       });
// //       return admin;
// //     });

// //     const token = generateToken(result.id, result.role, result.id);
// //     setAuthCookie(res, token);

// //     sendSuccessResponse(res, 201, "Account created", {
// //       token,
// //       user: { id: result.id, email: result.email, role: result.role },
// //     });
// //   } catch (err) {
// //     console.error("Sign-up Error:", err);
// //     sendErrorResponse(res, 500, "Server error");
// //     next(err);
// //   }
// // };

// export const signUp = async (
//   req: Request<{}, {}, z.infer<typeof signUpSchema>>,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   const parsed = signUpSchema.safeParse(req.body);
//   if (!parsed.success) {
//     sendErrorResponse(res, 400, 'Invalid input');
//     return;
//   }

//   const {
//     firstName,
//     lastName,
//     email,
//     password,
//     contactNumber,
//     companyName,
//     address,
//   } = parsed.data;

//   try {
//     const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

//     const result = await prisma.$transaction(async (tx) => {
//       // Create the admin user
//       const admin = await tx.admin.create({
//         data: {
//           firstName,
//           lastName,
//           email,
//           passwordHash: hashedPassword,
//           companyName,
//           contactInfo: { contactNumber },
//           address,
//           status: 'active',
//           role: 'admin',
//         },
//         select: { id: true, role: true, email: true },
//       });

//       // Retrieve the default plan
//       const defaultPlan = await tx.plan.findFirst({
//         where: {
//           name: 'Basic',
//           duration: '30 days',
//         },
//       });

//       if (!defaultPlan) {
//         throw new Error('Default plan not found');
//       }

//       // Calculate the subscription end date based on the plan's duration
//       const durationInDays = parseInt(defaultPlan.duration);
//       const startsAt = new Date();
//       const endsAt = new Date(startsAt.getTime() + durationInDays * 24 * 60 * 60 * 1000);

//       // Create the subscription
//       await tx.subscription.create({
//         data: {
//           adminId: admin.id,
//           planId: defaultPlan.id,
//           status: 'active',
//           startsAt,
//           endsAt,
//         },
//       });

//       return admin;
//     });

//     const token = generateToken(result.id, result.role, result.id);
//     setAuthCookie(res, token);

//     sendSuccessResponse(res, 201, 'Account created', {
//       token,
//       user: { id: result.id, email: result.email, role: result.role },
//     });
//   } catch (err) {
//     console.error('Sign-up Error:', err);
//     sendErrorResponse(res, 500, 'Server error');
//     next(err);
//   }
// };

// const signUpSuperAdminSchema = z.object({
//   firstName: z.string().min(1, "First name is required"),
//   lastName:  z.string().min(1, "Last name is required"),
//   email:     z.string().email("Must be a valid email"),
//   password:  z.string().min(8, "Password must be at least 8 characters"),
//   contactNumber: z.string().optional(),
//   address:       z.record(z.any()).optional(),
// });

// type SignUpSuperAdminBody = z.infer<typeof signUpSuperAdminSchema>;

// export const registerSuperAdmin = async (
//   req: Request<{}, {}, SignUpSuperAdminBody>,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   // 0) Validate input
//   const parsed = signUpSuperAdminSchema.safeParse(req.body);
//   if (!parsed.success) {
//     sendErrorResponse(res, 400, "Invalid input", {
//       errors: parsed.error.errors,
//     });
//     return;
//   }
//   const { firstName, lastName, email, password, contactNumber, address } =
//     parsed.data;

//   try {
//     // 1) Hash password
//     const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

//     // 2) Create super‑admin and its login credential in a transaction
//     const result = await prisma.$transaction(async (tx) => {
//       // a) create super admin
//       const superAdmin = await tx.superAdmin.create({
//         data: {
//           firstName,
//           lastName,
//           email,
//           passwordHash,
//           contactInfo: contactNumber ? { contactNumber } : undefined,
//           address,
//           status: "active",
//         },
//         select: { id: true, email: true },
//       });

//       // b) create login credential row
//       await tx.loginCredential.create({
//         data: {
//           role:       "super_admin",
//           email:      superAdmin.email,
//           passwordHash,
//           userProfileId: superAdmin.id,
//           status:     "active",
//         },
//       });

//       return superAdmin;
//     });

//     // 3) Issue JWT & set secure cookie
//     const token = generateToken(result.id, "super_admin", result.id);
//     setAuthCookie(res, token);

//     // 4) Respond
//     sendSuccessResponse(res, 201, "Super‑admin registered", {
//       token,
//       user: {
//         id:    result.id,
//         email: result.email,
//         role:  "super_admin",
//       },
//     });
//   } catch (err: any) {
//     console.error("registerSuperAdmin error:", err);
//     // handle unique constraint violation on email
//     if (err.code === "P2002" && err.meta?.target?.includes("email")) {
//       sendErrorResponse(res, 409, "Email already in use");
//     } else {
//       sendErrorResponse(res, 500, "Server error");
//     }
//     next(err);
//   }
// };

// src/controllers/auth.controller.ts

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma, env } from "../../config/database.config";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../core/utils/httpResponse";
import {
  generateToken,
  setAuthCookie,
} from "../../core/middleware/jwt/jwt.token";
import { signInSchema, signUpSchema } from "../../core/utils/zod";

const SALT_ROUNDS = parseInt(env.SALT_ROUNDS ?? "12", 10);

const signUpSuperAdminSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  contactNumber: z.string().optional(),
  address: z.record(z.any()).optional(),
});

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
          status: "active",
          role: "admin",
        },
        select: { id: true, role: true, email: true },
      });

      await tx.loginCredential.create({
        data: {
          role: "admin",
          email: a.email,
          passwordHash,
          userProfileId: a.id,
          adminId: a.id,
          status: "active",
        },
      });

      // fetch default “Basic” plan
      const plan = await tx.plan.findFirst({
        where: { name: "Basic", duration: "30 days" },
      });
      if (!plan) throw new Error("Default plan not found");

      // create subscription
      const startsAt = new Date();
      const endsAt = new Date(startsAt.getTime() + 30 * 24 * 3600 * 1000);
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
      user: { id: admin.id, email: admin.email, role: admin.role },
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

// ── SUPER-ADMIN REGISTER ────────────────────────────────────────────────────────

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
          status: "active",
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
          // superAdminId: sa.id,
          status: "active",
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
    const match = await bcrypt.compare(
      password,
      cred?.passwordHash || dummyHash
    );
    if (!cred || !match || cred.status !== "active" || !cred.userProfileId) {
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
        profile = await prisma.teamMember.findUnique({
          where: { id: cred.userProfileId },
          select: { id: true, firstName: true, lastName: true, role: true },
        });
        break;
      default:
        sendErrorResponse(res, 403, "Unsupported role");
        return;
    }

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
