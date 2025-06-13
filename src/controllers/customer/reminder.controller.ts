// src/controllers/reminder.controller.ts

import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.config";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../core/utils/responseHandler";
import dayjs from "dayjs";
import { UpdateHistoryBody, updateHistorySchema } from "../../core/utils/zod";
import { addMonths, addYears } from "../../core/utils/helper/dateHelpers";

// Helper to compute date windowsxx
function computeWindow(
  window: string,
  customStart?: string,
  customEnd?: string
): { start: Date; end: Date } {
  const today = dayjs().startOf("day");
  let start: dayjs.Dayjs;
  let end: dayjs.Dayjs;

  switch (window) {
    case "thisMonth":
      start = today.startOf("month");
      end = today.endOf("month");
      break;
    case "next15":
      start = today;
      end = today.add(15, "day");
      break;
    case "next30":
      start = today;
      end = today.add(30, "day");
      break;
    case "nextMonth":
      start = today.add(1, "month").startOf("month");
      end = today.add(1, "month").endOf("month");
      break;
    case "last15":
      start = today.subtract(15, "day");
      end = today;
      break;
    case "last30":
      start = today.subtract(30, "day");
      end = today;
      break;
    case "custom":
      if (!customStart || !customEnd) {
        throw new Error(
          "For custom window, both startDate and endDate must be provided"
        );
      }
      start = dayjs(customStart);
      end = dayjs(customEnd);
      break;
    default:
      // default to next 15 days
      start = today;
      end = today.add(15, "day");
  }

  return { start: start.toDate(), end: end.toDate() };
}

/**
 * GET /api/v1/reminders
 * Query params:
 *   timeWindow: one of [next15, next30, nextMonth, last15, last30, custom] (default: next15)
 *   startDate, endDate (ISO strings, required only if timeWindow=custom)
 *   productName: partial match on productName
 */
// # Custom range
// curl -X GET "https://localhost:3000/api/v1/reminders?timeWindow=custom&startDate=2025-06-01&endDate=2025-07-01" \
//   -H "Authorization: Bearer <token>"
export const listRenewalReminders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1) Auth
    const user = req.user;
    if (!user || !user.adminId) {
      sendErrorResponse(res, 401, "Unauthorized");
      return;
    }
    const adminId = user.role === "admin" ? user.id : user.adminId!;

    // 2) Parse query
    const {
      timeWindow = "next15",
      startDate,
      endDate,
      productName,
      customerSearch, // ← new
      partnerSearch, // ← new
    } = req.query as Record<string, string>;

    // console.log("partnerSearch---->", timeWindow);

    let range;
    try {
      range = computeWindow(timeWindow, startDate, endDate);
    } catch (err: any) {
      sendErrorResponse(res, 400, err.message);
      return;
    }
    // console.log("range---->", timeWindow);

    // 3) Build Prisma filter
    const where: any = {
      adminId,
      expiryDate: {
        gte: range.start,
        lte: range.end,
      },
      status: true,
    };
    if (productName) {
      where.product = {
        productName: {
          contains: productName,
          mode: "insensitive",
        },
      };
    }

    // ── Customer search ─────────────────────────────────────────────────────
    if (customerSearch) {
      where.customer = {
        is: {
          OR: [
            { companyName: { contains: customerSearch, mode: "insensitive" } },
            {
              contactPerson: { contains: customerSearch, mode: "insensitive" },
            },
          ],
          // ── Partner search nested inside customer ────────────────────────
          ...(partnerSearch
            ? {
                partner: {
                  is: {
                    OR: [
                      {
                        companyName: {
                          contains: partnerSearch,
                          mode: "insensitive",
                        },
                      },
                      {
                        firstName: {
                          contains: partnerSearch,
                          mode: "insensitive",
                        },
                      },
                      {
                        lastName: {
                          contains: partnerSearch,
                          mode: "insensitive",
                        },
                      },
                    ],
                  },
                },
              }
            : {}),
        },
      };
    } else if (partnerSearch) {
      // If no customerSearch, but partnerSearch exists:
      where.customer = {
        is: {
          partner: {
            is: {
              OR: [
                {
                  companyName: { contains: partnerSearch, mode: "insensitive" },
                },
                { firstName: { contains: partnerSearch, mode: "insensitive" } },
                { lastName: { contains: partnerSearch, mode: "insensitive" } },
              ],
            },
          },
        },
      };
    }

    // 4) Query
    const reminders = await prisma.customerProductHistory.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            productName: true,
            productPrice: true,
            description: true,
            specifications: true,
            status: true,
          },
        },
        customer: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
            mobileNumber: true,
            email: true,
            serialNo: true,
            adminCustomFields: true,
            address: true,
            hasReference: true,
            status: true,
            partner: {
              select: {
                companyName: true,
                firstName: true,
                lastName: true,
                contactInfo: true,
                email: true,
                status: true,
              },
            },
          },
        },
        admin: {
          select: {
            companyName: true,
            contactInfo: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { expiryDate: "asc" },
    });

    // 5) Return
    sendSuccessResponse(res, 200, "Renewal reminders fetched", { reminders });
    return;
  } catch (err) {
    console.error("listRenewalReminders error:", err);
    sendErrorResponse(res, 500, "Server error");
    return;
  }
};

export const updateCustomerProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const historyId = req.params.id;
  if (!historyId) {
    sendErrorResponse(res, 400, "Invalid input");
    return;
  }

  // 1) Validate body
  const parsed = updateHistorySchema.safeParse(req.body);
  if (!parsed.success) {
    sendErrorResponse(res, 400, "Invalid input", {
      errors: parsed.error.errors,
    });
    return;
  }
  const data = parsed.data;
  const mode =
    (req.query.mode as string)?.toLowerCase() === "autofill"
      ? "autofill"
      : "manual";

  // 2) Auth check
  const user = req.user as { id: string; role: string; adminId?: string };
  if (!user) {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }
  const adminId = user.role === "admin" ? user.id : user.adminId!;

  try {
    // console.log("\n\nmode---->", mode);
    // a) First fetch the existing history entry to ensure:
    //    - it exists
    //    - it belongs to this admin
    const existing = await prisma.customerProductHistory.findUnique({
      where: { id: historyId, renewal: true },
      select: {
        id: true,
        adminId: true,
        productId: true,
        purchaseDate: true,
        expiryDate: true,
        renewalDate: true,
        renewal: true,
        status: true,
        renewPeriod: true,
      },
    });
    //console.log("\n\n\nexisting---->", existing, "\n\n\n");
    if (!existing || existing.adminId !== adminId) {
      sendErrorResponse(
        res,
        404,
        "History entry not found or renewal canceled"
      );
      return;
    }
    // console.log("\n\n\nexisting------>", existing);
    let updateData: Record<string, any> = {};

    if (mode === "autofill") {
      if (!existing.renewalDate) {
        sendErrorResponse(
          res,
          400,
          "Cannot autofill renewal dates because renewalDate is missing"
        );
        return;
      }

      const purchase = new Date(existing.renewalDate);
      let renewalDate: Date;
      let expiryDate: Date;
     // console.log("\n\nexisting.renewPeriod--->", existing.renewPeriod);

      switch (existing.renewPeriod) {
        case "monthly":
          renewalDate = addMonths(purchase, 1);
          expiryDate = new Date(renewalDate);
          expiryDate.setDate(expiryDate.getDate() - 1);
          break;

        case "quarterly":
          renewalDate = addMonths(purchase, 3);
          expiryDate = new Date(renewalDate);
          expiryDate.setDate(expiryDate.getDate() - 1);
          break;

        case "half_yearly":
          renewalDate = addMonths(purchase, 6);
          expiryDate = new Date(renewalDate);
          expiryDate.setDate(expiryDate.getDate() - 1);
          break;

        case "yearly":
          renewalDate = addYears(purchase, 1);
          expiryDate = new Date(renewalDate);
          expiryDate.setDate(expiryDate.getDate() - 1);
          break;

        case "custom":
        default:
          // For custom, trust the incoming values (if any)
          sendErrorResponse(
            res,
            400,
            "Autofill not applicable for custom period"
          );
          return;
      }

      updateData = {
        purchaseDate: purchase,
        expiryDate: expiryDate,
        renewalDate: renewalDate,
        renewal: true,
      };

      // console.log(
      //   "daysBetweenPurchaseAndExpiry -----→",
      //   daysBetweenPurchaseAndExpiry
      // );
      // console.log(
      //   "daysBetweenExpiryAndRenewal -----→",
      //   daysBetweenExpiryAndRenewal
      // );
      // console.log("\nAutofill dates -----→", {
      //   newPurchaseDate: newPurchaseDate.toDate(),
      //   newExpiryDate: newExpiryDate.toDate(),
      //   newRenewalDate: newRenewalDate?.toDate() ?? null,
      // });
    } else {
      updateData = {
        purchaseDate: data.purchaseDate
          ? new Date(data.purchaseDate)
          : existing.purchaseDate,
        expiryDate: data.expiryDate
          ? new Date(data.expiryDate)
          : existing.expiryDate,
        renewalDate: data.renewalDate
          ? new Date(data.renewalDate)
          : existing.renewalDate,
        renewal: data.renewal !== undefined ? data.renewal : existing.renewal,
        status: data.status !== undefined ? data.status : existing.status,
      };
    }

    const reminders = await prisma.customerProductHistory.update({
      where: { id: historyId },
      data: updateData,
    });

    // b) Now update by id
    // const updatedHistory = await prisma.customerProductHistory.update({
    //   where: { id: historyId },
    //   data: {
    //     ...(data.purchaseDate && {
    //       purchaseDate: new Date(data.purchaseDate),
    //     }),
    //     ...(data.renewal !== undefined && { renewal: data.renewal }),
    //     ...(data.expiryDate && { expiryDate: new Date(data.expiryDate) }),
    //     ...(data.renewalDate && { renewalDate: new Date(data.renewalDate) }),
    //     ...(data.status !== undefined && { status: data.status }),
    //   },
    // });

    // c) Append a snapshot into ProductRenewalHistory
    const renewalRecord = await prisma.productRenewalHistory.create({
      data: {
        customerProductHistoryId: historyId,
        productId: existing.productId,
        purchaseDate: existing.purchaseDate,
        expiryDate: existing.expiryDate,
        renewalDate: existing.renewalDate,
      },
    });

    // console.log("\n reminders----->", reminders);
    // console.log("\n renewalRecord----->", renewalRecord);

    sendSuccessResponse(res, 200, `Product history updated (${mode})`, {
      reminders,
    });
  } catch (err: any) {
    console.error("updateCustomerProduct error:", err);
    sendErrorResponse(res, 500, "Server error");
  }
};
