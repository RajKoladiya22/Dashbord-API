// src/controllers/auth/partnerAuth.controller.ts
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { prisma, env } from "../../config/database.config";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../core/utils/httpResponse";
import { CreatePartnerInput } from "../../core/utils/zod";

const SALT_ROUNDS = parseInt(env.SALT_ROUNDS ?? "12", 10);


// ── Create Partner Handler ────────────────────────────────────────────────────────────
// export const createPartner = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     if (req.user?.role !== "admin") {
//       sendErrorResponse(res, 403, "Only admins can create partners.");
//       return;
//     }
//     const adminID = req.user?.id;
//     const { firstName, companyName, contact_info, email, password } =
//       req.body;
//     // console.log("req.body-->\n", req.body);
     
//     const [first_Name, ...rest] = firstName.trim().split(" ");
//     const lastName = rest.join(" ") || "";

    

//     const partner = await prisma.$transaction(async (tx) => {
//       const exists = await tx.partner.findUnique({
//         where: { email: email.toLowerCase() },
//       });
//       if (exists) throw new Error("Email already in use.");

//       const passwordHash = await bcrypt.hash(password, 12);
//       return tx.partner.create({
//         data: {
//           adminId: adminID,
//           role: "partner",
//           companyName: companyName,
//           firstName: first_Name,
//           lastName,
//           contactInfo: contact_info ?? {},
//           address: {},
//           email: email.toLowerCase(),
//           passwordHash,
//           status: "active",
//         },
//         select: { id: true, email: true, firstName: true, lastName: true },
//       });
//     });

//     sendSuccessResponse(res, 201, "Partner created successfully.", { partner });
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


export const createPartner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user?.role !== "admin") {
      sendErrorResponse(res, 403, "Only admins can create partners.");
      return;
    }
    const adminID = req.user.id;
    const { firstName, companyName, contact_info, email, password } =
      req.body as CreatePartnerInput;

    // split first/last
    const [first_Name, ...rest] = firstName.trim().split(" ");
    const lastName = rest.join(" ") || "";

    const partnerWithCreds = await prisma.$transaction(async (tx) => {
      // 1) ensure email uniqueness
      const exists = await tx.partner.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (exists) throw new Error("Email already in use.");

      // 2) hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // 3) create partner record
      const p = await tx.partner.create({
        data: {
          adminId: adminID,
          role: "partner",
          companyName,
          firstName: first_Name,
          lastName,
          contactInfo: contact_info ?? {},
          address: {},
          email: email.toLowerCase(),
          passwordHash,
        },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      // 4) mirror into loginCredential
      await tx.loginCredential.create({
        data: {
          role: "partner",
          email: p.email,
          passwordHash,
          userProfileId: p.id,
          adminId: adminID,    // ties back to the owning admin
        },
      });

      return p;
    });

    sendSuccessResponse(
      res,
      201,
      "Partner created successfully.",
      { partner: partnerWithCreds }
    );
  } catch (err: any) {
    if (err.message === "Email already in use.") {
      sendErrorResponse(res, 409, err.message);
    } else {
      console.error("Error creating partner:", err);
      sendErrorResponse(res, 500, "Internal server error.");
    }
    // next(err);
  }
};