// src/controllers/auth/teamAuth.controller.ts

import { Request, Response, NextFunction } from "express";
import { prisma, env } from "../../config/database.config";
import bcrypt from "bcrypt";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../core/utils/httpResponse";
import { CreateTeamMemberInput } from "../../core/utils/zod";
import nodemailer from "nodemailer";
import { log } from "console";
const mailtransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "magicallydev@gmail.com",
    pass: "szlm wgaw fkrz pbdc", // App password
  },
});

const SALT_ROUNDS = parseInt(env.SALT_ROUNDS ?? "12", 10);

// ── Create TeamMember Handler ────────────────────────────────────────────────────────────
// export const createTeamMember = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   // 1. Validate input
//   const { full_name, email, password, department, position } = req.body;

//   try {
//     // 2. Interactive transaction
//     const teamMember = await prisma.$transaction(async (tx) => {
//       if (req.user?.role !== "admin") {
//         sendErrorResponse(res, 403, "Only admins can create partners.");
//         return;
//       }
//       const adminId = req.user?.id;
//       const [firstName, ...rest] = full_name.trim().split(" ");
//       const lastName = rest.join(" ") || "";
//       // 2a. Check email uniqueness
//       const exists = await tx.teamMember.findUnique({
//         where: { email: email.toLowerCase() },
//       });
//       if (exists) {
//         throw new Error("Email already in use.");
//       }

//       // 2b. Hash password
//       const saltRounds = parseInt(process.env.SALT_ROUNDS ?? "10", 10);
//       const passwordHash = await bcrypt.hash(password, saltRounds);

//       // 2c. Create the TeamMember record
//       return tx.teamMember.create({
//         data: {
//           adminId,
//           firstName,
//           lastName,
//           email: email.toLowerCase(),
//           passwordHash,
//           department,
//           position,
//           status: "active",
//           role: "team_member", // explicit even though default covers it
//         },
//         select: {
//           id: true,
//           firstName: true,
//           lastName: true,
//           email: true,
//           department: true,
//           position: true,
//           status: true,
//           createdAt: true,
//         },
//       });
//     });

//     // 3. Send response
//     sendSuccessResponse(res, 201, "Team member created", { teamMember });
//   } catch (error: any) {
//     console.error("createTeamMember error:", error);
//     // If we threw our uniqueness Error, map to 409
//     if (error.message === "Email already in use.") {
//       sendErrorResponse(res, 409, error.message);
//     } else {
//       sendErrorResponse(res, 500, "Server error");
//     }
//     next(error);
//   }
// };

export const createTeamMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. Validate that only admins can call
  if (req.user?.role !== "admin") {
    sendErrorResponse(res, 403, "Only admins can create team members.");
    return;
  }
  console.log("call createTeamMember---------");

  // 2. Extract & validate body
  const {
    firstName,
    email,
    password,
    department,
    position,
    role, // must be "team_member" or "sub_admin"
  } = req.body as CreateTeamMemberInput;

  if (!["team_member", "sub_admin"].includes(role)) {
    sendErrorResponse(res, 400, "Role must be 'team_member' or 'sub_admin'.");
    return;
  }

  try {
    const adminId = req.user.id;
    const [FN, ...rest] = firstName.trim().split(" ");
    const lastName = rest.join(" ") || "";

    // 3. Run both inserts in a single transaction
    const newMember = await prisma.$transaction(async (tx) => {
      // 3a. ensure unique email
      const exists = await tx.teamMember.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (exists) {
        throw new Error("Email already in use.");
      }

      // 3b. hash the password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // 3c. create the team member
      const member = await tx.teamMember.create({
        data: {
          adminId,
          firstName: FN,
          lastName,
          email: email.toLowerCase(),
          passwordHash,
          department,
          position,
          role, // assign from request
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          department: true,
          position: true,
          role: true,
          createdAt: true,
        },
      });

      // 3d. mirror into loginCredential
      await tx.loginCredential.create({
        data: {
          role,
          email: member.email,
          passwordHash,
          userProfileId: member.id,
          adminId, // who created them
        },
      });

      if (member) {
        const mailOptions = {
          from: "magicallydev@gmail.com",
          to: member.email,
          subject: "🎉 Welcome to the Team!",
          html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4CAF50;">Welcome to the Team, ${member.firstName} ${member.lastName}!</h2>
        <p>We're excited to have you onboard. Below are your login credentials and role details:</p>

        <table style="border-collapse: collapse; width: 100%; margin-top: 20px;">
          <tr><th style="padding: 8px; background-color: #f2f2f2;">Name</th><td style="padding: 8px;">${member.firstName} ${member.lastName}</td></tr>
          <tr><th style="padding: 8px; background-color: #f2f2f2;">Email</th><td style="padding: 8px;">${member.email}</td></tr>
          <tr><th style="padding: 8px; background-color: #f2f2f2;">Password</th><td style="padding: 8px;">${password}</td></tr>
          <tr><th style="padding: 8px; background-color: #f2f2f2;">Department</th><td style="padding: 8px;">${member.department}</td></tr>
          <tr><th style="padding: 8px; background-color: #f2f2f2;">Position</th><td style="padding: 8px;">${member.position}</td></tr>
          <tr><th style="padding: 8px; background-color: #f2f2f2;">Role</th><td style="padding: 8px;">${member.role}</td></tr>
        </table>

        <p style="margin-top: 20px;">Please change your password after your first login for security purposes.</p>
        <p style="margin-top: 40px;">Best regards,<br><strong>Admin Team</strong></p>
      </div>
    `,
        };

        mailtransport.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Email sending failed...", error);
          } else {
            console.log("Email sent successfully...", info.response);
          }
        }); 
      }

      return member;
    });

    // 4. send back the created profile
    sendSuccessResponse(res, 201, "Team member created successfully.", {
      teamMember: newMember,
    });
  } catch (err: any) {
    console.error("createTeamMember error:", err);
    if (err.message === "Email already in use.") {
      sendErrorResponse(res, 409, err.message);
    } else {
      sendErrorResponse(res, 500, "Server error");
    }
    // next(err);
  }
};
