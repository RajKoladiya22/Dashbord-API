// src/controllers/team.controller.ts

import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.config";
import bcrypt from "bcrypt";
import { z } from "zod";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../core/utils/httpResponse";

const createTeamMemberSchema = z.object({
  adminId: z.string().uuid(),
  full_name: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  department: z.string().optional(),
  position: z.string().optional(),
  status: z.string().default("active"),
  contactInfo: z
    .object({ phone: z.string().optional(), email: z.string().optional() })
    .optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
    })
    .optional(),
});
type CreateTeamMemberBody = z.infer<typeof createTeamMemberSchema>;

// export const createTeamMember = async (
//   req: Request<{}, {}, CreateTeamMemberBody>,
//   res: Response,
//   next: NextFunction
// ) => {
//   // 1. Validate request body
//   // const parsed = createTeamMemberSchema.safeParse(req.body);
//   // console.log("parsed--->", parsed);

//   // if (!parsed.success) {
//   //   sendErrorResponse(res, 400, "Invalid input", {
//   //     errors: parsed.error.errors,
//   //   });
//   //   return;
//   // }
//   const { full_name, email, password, department, position } = req.body;

//   try {
//     const [firstName, ...rest] = full_name.trim().split(" ");
//     const lastName = rest.join(" ") || "";
//     if (req.user?.role !== "admin") {
//       sendErrorResponse(res, 403, "Only admins can create partners.");
//       return;
//     }
//     const adminId = req.user?.id;
//     // 2. Ensure the admin exists
//     const adminExists = await prisma.admin.findUnique({
//       where: { id: adminId },
//       select: { id: true },
//     });
//     if (!adminExists) {
//       sendErrorResponse(res, 404, "Admin not found");
//       return;
//     }

//     // 3. Hash the password
//     const saltRounds = parseInt(process.env.SALT_ROUNDS ?? "10", 10);
//     const passwordHash = await bcrypt.hash(password, saltRounds);

//     // 4. Create the TeamMember (loginCredential auto-created via trigger)
//     const teamMember = await prisma.teamMember.create({
//       data: {
//         adminId,
//         firstName,
//         lastName,
//         email,
//         passwordHash,
//         department,
//         position,
//         status: "active",
//         role: "team_member", // explicit, though default covers it
//       },
//       select: {
//         id: true,
//         firstName: true,
//         lastName: true,
//         email: true,
//         department: true,
//         position: true,
//         status: true,
//         createdAt: true,
//       },
//     });

//     // 5. Respond
//     sendSuccessResponse(res, 201, "Team member created", { teamMember });
//   } catch (err: any) {
//     if (err.message === "Email already in use.") {
//       sendErrorResponse(res, 409, err.message);
//     } else {
//       console.error("Error creating partner:", err);
//       sendErrorResponse(res, 500, "Internal server error.");
//     }
//     next(err);
//   }
// };

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
