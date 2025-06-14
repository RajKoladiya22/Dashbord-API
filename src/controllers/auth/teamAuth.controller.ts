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

const SMTP_USER = env.SMTP_USER || "magicallydev@gmail.com";
const SMTP_PASS = env.SMTP_PASS || "szlm wgaw fkrz pbdc";

if (!SMTP_USER || !SMTP_PASS) {
  throw new Error("SMTP_USER and SMTP_PASS must be set in environment variables.");
}

const mailtransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
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
      // 
      const existsAny = await tx.loginCredential.findUnique({
        where: { email: email.toLowerCase() },
      })
      if (exists || existsAny) {
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

      // log("Created team member:", member);

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

      // log("\n\n Created login credential for:", member);

      if (member) {
         const mailOptions = {
          from: "magicallydev@gmail.com",
          to: member.email,
          subject: `Welcome to MagicallyDev, ${member.firstName}!`,
          html: `
  <div style="background-color: #f6f8fa; padding: 60px 0; font-family: 'Helvetica Neue', sans-serif; color: #222;">
    <div style="max-width: 620px; margin: auto; background-color: #ffffff; border-radius: 12px; padding: 48px; box-shadow: 0 6px 20px rgba(0,0,0,0.08);">
      
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 35px;">
        <h1 style="margin: 0; font-size: 26px; color: #111;">👋 Welcome to the Team</h1>
        <p style="font-size: 15px; color: #555;">We’re excited to have you with us, ${member.firstName}!</p>
      </div>

      <!-- Body -->
      <p style="font-size: 15px; line-height: 1.6;">
        Your account has been created. Below are your login credentials. Please log in as soon as possible and remember to update your password.
      </p>

      <!-- Account Details -->
      <div style="background-color: #f9fafa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 30px 0;">
        <p style="margin: 8px 0;"><strong>Full Name:</strong> ${member.firstName} ${member.lastName}</p>
        <p style="margin: 8px 0;"><strong>Email:</strong> ${member.email}</p>
        <p style="margin: 8px 0;"><strong>Temporary Password:</strong> ${password}</p>
      </div>

      <!-- Button -->
      <div style="text-align: center; margin: 35px 0;">
        <a href="https://dashbord-seven-sigma.vercel.app/auth/signin" style="background-color: #000000; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
          Login to Your Account
        </a>
      </div>

      <!-- Footer -->
      <p style="font-size: 14px; color: #666; line-height: 1.5;">
        If you need help or have questions, don’t hesitate to contact your team lead or our support desk.
      </p>

      <p style="margin-top: 40px; font-size: 14px;">
        Welcome once again, and let’s build something magical!<br>
        <strong style="color: #000;">— The MagicallyDev Admin Team</strong>
      </p>
    </div>
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