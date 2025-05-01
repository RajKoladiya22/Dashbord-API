// src/controllers/auth.controller.ts

// import { Request, Response, NextFunction } from "express";
// import { prisma } from "../../config/database.config";
// import bcrypt from "bcrypt";
// import {
//   sendSuccessResponse,
//   sendErrorResponse,
// } from "../../core/utils/responseHandler";
// import { generateToken, setAuthCookie } from "../../core/middleware/jwt/jwt.token";
// import { signInBody, signUpBody } from "@core/utils/interfaces";

// enum Role {
//   "admin",
//   "team_member",
//   "partner",
//   "super_admin",
// }

// export const signIn = async (
//   req: Request<{}, {}, signInBody>,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   const { identifier, password } = req.body;
//   const email = identifier;

//   // console.log("REQ.BODY-->", req.body);
//   // 1. Basic input validation
//   if (typeof email !== "string" || typeof password !== "string") {
//     sendErrorResponse(res, 400, "Email and password are required"); // missing or wrong types
//     return;
//   }

//   try {
//     // 2. Fetch and verify credential & role
//     const cred = await prisma.loginCredential.findUnique({
//       where: { email },
//     });
//     // console.log("Cred--->", cred);

//     if (!cred || !cred.role || !cred.adminId || !cred.userProfileId) {
//       sendErrorResponse(res, 401, "Invalid credentials"); // wrong email/role

//       return;
//     }

//     // const adminIdToCheck =
//     //   cred.role === "admin" ? cred.userProfileId : cred.adminId;

//     // 3. Verify password
//     const match = await bcrypt.compare(password, cred.passwordHash);
//     if (!match) {
//       sendErrorResponse(res, 401, "Invalid credentials"); // wrong password

//       return;
//     }

//     // 4. Find _one_ active subscription: endsAt > now, status = active
//     const now = new Date();
//     const subscription = await prisma.subscription.findFirst({
//       where: {
//         adminId: cred.adminId!,
//         status: "active",
//         endsAt: { gt: now }, // endsAt > now :contentReference[oaicite:5]{index=5}
//       },
//       orderBy: { endsAt: "desc" }, // most generous remaining term :contentReference[oaicite:6]{index=6}
//     });

//     if (!subscription) {
//       sendErrorResponse(res, 403, "No active subscription"); // no valid plan
//       return;
//     }

//     // 5. Generate JWT
//     const token = generateToken(cred.userProfileId, cred.role, cred.adminId);

//     // Set secure cookie options
//     setAuthCookie(res, token);

//     // 6. Respond with token
//     sendSuccessResponse(res, 200, "Logged in successfully", {
//       token: token,
//       user: {
//         id: cred.userProfileId,
//         email: cred.email,
//         role: cred.role,
//       },
//     });
//   } catch (err) {
//     console.error("Login Error:", err);
//     sendErrorResponse(res, 500, "Server error");
//     next(err);
//   }
// };

// export const signUp = async (
//   req: Request<{}, {}, signUpBody>,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//    const {
//     firstName,
//     lastName,
//     email,
//     password,
//     contactNumber,
//     companyName,
//     address,
//     planStatus, // come static "free_trial"
//   } = req.body;
//   // console.log("1. \nREQ.BODY-->", req.body);
//   if (!firstName || !lastName || !email || !password) {
//     sendErrorResponse(res, 400, "Missing required fields");
//   }

//   // 1. Basic input validation
//   if (typeof email !== "string" || typeof password !== "string") {
//     sendErrorResponse(res, 400, "Email and password are required"); // missing or wrong types
//     return;
//   }

//   try {
//     // 2. Check for Email Exists
//     const emailExists = await prisma.admin.findUnique({
//       where: { email },
//     });

//     if (emailExists) {
//       sendErrorResponse(res, 409, "Email already exists"); // wrong email/role
//       return;
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     //3. add in admin table
//     const admin = await prisma.admin.create({
//       data: {
//         firstName,
//         lastName,
//         email,
//         passwordHash: hashedPassword,
//         companyName,
//         contactInfo: { contactNumber: contactNumber },
//         address,
//         status: "active",
//         role: "admin",
//       },
//     });
//     // console.log("2. \nadmin-->", admin);
//     //4. add in loginCredential table
//     // const loginCredential = await prisma.loginCredential.create({
//     //   data: {
//     //     role: admin.role,
//     //     email: admin.email,
//     //     passwordHash: hashedPassword,
//     //     userProfileId: admin.id,
//     //     adminId: admin.id,
//     //   },
//     // });
//     // console.log("3. \nloginCredential-->", loginCredential);
//     // 5. add default free plan for 30 days
//     const subscription = await prisma.subscription.create({
//       data: {
//         adminId: admin.id,
//         planId: "9a23eec9-3e25-4f8c-bbb4-d1c9e0f97668",
//         status: "active",
//         startsAt: new Date(),
//         endsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
//       },
//     });
//     // console.log("4. \nsubscription-->", subscription);
//     // 6. Generate JWT
//     const token = generateToken(admin.id, admin.role, admin.id);

//     // 7. Respond with token
//     sendSuccessResponse(res, 200, "Account created successfully", {
//       token: token,
//       user: {
//         id: admin.id,
//         email: admin.email,
//         role: admin.role,
//       },
//     });
//   } catch (err) {
//     console.error("Sign-up Error:", err);
//     sendErrorResponse(res, 500, "Server error");
//     next(err);
//   }
// };

// await prisma.loginAudit.create({
//   data: {
//     loginCredentialId: cred.id,
//     success: false,
//     ipAddress: req.ip,
//     userAgent: req.headers["user-agent"],
//   },
// });

// 6. Record successful login
// await prisma.loginAudit.create({
//   data: {
//     loginCredentialId: cred.id,
//     success: true,
//     ipAddress: req.ip,
//     userAgent: req.headers["user-agent"],
//   },
// });




// src/controllers/auth.controller.ts

// import { Request, Response, NextFunction } from "express";
// import { prisma, env } from "../../config/database.config";
// import bcrypt from "bcrypt";
// import {
//   sendSuccessResponse,
//   sendErrorResponse,
// } from "../../core/utils/responseHandler";
// import {
//   generateToken,
//   setAuthCookie,
// } from "../../core/middleware/jwt/jwt.token";
// import { signInSchema, signUpSchema } from "@core/utils/interfaces";
// import { z } from "zod";

// enum Role {
//   admin = "admin",
//   team_member = "team_member",
//   partner = "partner",
//   super_admin = "super_admin",
// }

// export const signIn = async (
//   req: Request<{}, {}, z.infer<typeof signInSchema>>,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   // Validate input
//   const parsed = signInSchema.safeParse(req.body);
//   if (!parsed.success) {
//     sendErrorResponse(res, 400, "Invalid input");
//     return;
//   }
//   const { identifier: email, password } = parsed.data;

//   try {
//     // Fetch credential
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

//     if (!cred) {
//       sendErrorResponse(res, 401, "Invalid credentials");
//       return;
//     }

//     // check status is active in loginCredential

//     // Verify password
//     const match = await bcrypt.compare(password, cred.passwordHash);
//     if (!match) {
//       sendErrorResponse(res, 401, "Invalid credentials");
//       return;
//     }

//     // Check active subscription
//     const subscription = await prisma.subscription.findFirst({
//       where: {
//         adminId: cred.adminId!,
//         status: "active",
//         endsAt: { gt: new Date() },
//       },
//       orderBy: { endsAt: "desc" },
//       select: { id: true },
//     });

//     if (!subscription) {
//       sendErrorResponse(res, 403, "No active subscription");
//       return;
//     }

//     // Issue JWT
//     const token = generateToken(cred.userProfileId, cred.role, cred.adminId!);
//     setAuthCookie(res, token);

//     sendSuccessResponse(res, 200, "Logged in", {
//       token,
//       user: {
//         id: cred.userProfileId,
//         email,
//         role: cred.role,
//       },
//     });
//   } catch (err) {
//     console.error("Login Error:", err);
//     sendErrorResponse(res, 500, "Server error");
//     next(err);
//   }
// };

// export const signUp = async (
//   req: Request<{}, {}, z.infer<typeof signUpSchema>>,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   // Validate input
//   const parsed = signUpSchema.safeParse(req.body);
//   if (!parsed.success) {
//     sendErrorResponse(res, 400, "Invalid input");
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
//     // Ensure unique email
//     const exists = await prisma.admin.findUnique({
//       where: { email },
//       select: { id: true },
//     });
//     if (exists) {
//       sendErrorResponse(res, 409, "Email already registered");
//       return;
//     }

//     // Hash password
//     const hashed = await bcrypt.hash(password, env.SALT_ROUNDS);

//     // Create admin; loginCredential will be inserted via trigger
//     const admin = await prisma.admin.create({
//       data: {
//         firstName,
//         lastName,
//         email,
//         passwordHash: hashed,
//         companyName,
//         contactInfo: { contactNumber: contactNumber },
//         address,
//         status: "active",
//         role: "admin",
//       },
//     });

//     if (admin) {
//       await prisma.subscription.create({
//         data: {
//           adminId: admin.id,
//           planId: "41cf83f7-2d28-430a-82ac-813d0a489aab",
//           status: "active",
//           startsAt: new Date(),
//           endsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
//         },
//       });
//     }

//     // Generate token & respond
//     const token = generateToken(admin.id, admin.role, admin.id);
//     setAuthCookie(res, token);

//     sendSuccessResponse(res, 201, "Account created", {
//       token,
//       user: {
//         id: admin.id,
//         email: admin.email,
//         role: admin.role,
//       },
//     });
//   } catch (err) {
//     console.error("Sign-up Error:", err);
//     sendErrorResponse(res, 500, "Server error");
//     next(err);
//   }
// };


















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
  const parsed = signInSchema.safeParse(req.body);
  if (!parsed.success) {
    sendErrorResponse(res, 400, "Invalid input");
    return;
  }
  const { identifier: email, password } = parsed.data;

  try {
    // Bundle credential lookup + subscription check in one transaction
    const [cred, subscription] = await prisma.$transaction([
      prisma.loginCredential.findUnique({
        where: { email },
        select: { passwordHash: true, role: true, adminId: true, userProfileId: true, status: true }
      }),
      prisma.subscription.findFirst({
        where: { status: "active", endsAt: { gt: new Date() } },
        orderBy: { endsAt: "desc" },
        select: { id: true }
      })
    ]);

    if (!cred || cred.status !== "active" || !cred.userProfileId || !cred.adminId) {
      sendErrorResponse(res, 401, "Invalid credentials");
      return;
    }

    const match = await bcrypt.compare(password, cred.passwordHash);
    if (!match) {
      sendErrorResponse(res, 401, "Invalid credentials");
      return;
    }

    if (!subscription) {
      sendErrorResponse(res, 403, "No active subscription");
      return;
    }

    const token = generateToken(cred.userProfileId, cred.role, cred.adminId!);
    setAuthCookie(res, token);  // Secure flags set in JWT middleware

    sendSuccessResponse(res, 200, "Logged in", {
      token,
      user: { id: cred.userProfileId, email, role: cred.role }
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
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);  // :contentReference[oaicite:18]{index=18}
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
