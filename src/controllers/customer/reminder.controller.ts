// src/controllers/reminder.controller.ts

import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.config";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../core/utils/responseHandler";
import dayjs from "dayjs";

// Helper to compute date windows
function computeWindow(
  window: string,
  customStart?: string,
  customEnd?: string
): { start: Date; end: Date } {
  const today = dayjs().startOf("day");
  let start: dayjs.Dayjs;
  let end: dayjs.Dayjs;

  switch (window) {
    case "next15":
      start = today;
      end = today.add(15, "day");
      break;
    case "next30":
      start = today;
      end = today.add(30, "day");
      break;
    case "nextMonth":
      start = today;
      end = today.add(1, "month");
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
 *   window: one of [next15, next30, nextMonth, last15, last30, custom] (default: next15)
 *   startDate, endDate (ISO strings, required only if window=custom)
 *   productName: partial match on productName
 */
// # Custom range
// curl -X GET "https://api.example.com/api/v1/reminders?window=custom&startDate=2025-06-01&endDate=2025-07-01" \
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
      window = "next15",
      startDate,
      endDate,
      productName,
    } = req.query as Record<string, string>;

    let range;
    try {
      range = computeWindow(window, startDate, endDate);
    } catch (err: any) {
      sendErrorResponse(res, 400, err.message);
      return;
    }

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

    // 4) Query
    const reminders = await prisma.customerProductHistory.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            productName: true,
          },
        },
        customer: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
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
