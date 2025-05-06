// src/controllers/auth/partnerAuth.controller.ts
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../../config/database.config";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../core/utils/httpResponse";
import { CreatePartnerInput } from "../../core/utils/zod";


// ── Create Partner Handler ────────────────────────────────────────────────────────────
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
    const adminID = req.user?.id;
    const { firstName, companyName, contact_info, email, password } =
      req.body;
    // console.log("req.body-->\n", req.body);
     
    const [first_Name, ...rest] = firstName.trim().split(" ");
    const lastName = rest.join(" ") || "";

    

    const partner = await prisma.$transaction(async (tx) => {
      const exists = await tx.partner.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (exists) throw new Error("Email already in use.");

      const passwordHash = await bcrypt.hash(password, 12);
      return tx.partner.create({
        data: {
          adminId: adminID,
          role: "partner",
          companyName: companyName,
          firstName: first_Name,
          lastName,
          contactInfo: contact_info ?? {},
          address: {},
          email: email.toLowerCase(),
          passwordHash,
          status: "active",
        },
        select: { id: true, email: true, firstName: true, lastName: true },
      });
    });

    sendSuccessResponse(res, 201, "Partner created successfully.", { partner });
  } catch (err: any) {
    if (err.message === "Email already in use.") {
      sendErrorResponse(res, 409, err.message);
    } else {
      console.error("Error creating partner:", err);
      sendErrorResponse(res, 500, "Internal server error.");
    }
    next(err);
  }
};
