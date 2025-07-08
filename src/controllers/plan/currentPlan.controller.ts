import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../config/database.config";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../core/utils/responseHandler";
import { SubscriptionStatus } from "@prisma/client";

import {
  isBefore,
  isAfter,
  isSameDay,
  differenceInDays,
} from "date-fns";

export const currentPlan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user;

  if (!user || user.role !== "admin") {
    sendErrorResponse(res, 401, "Unauthorized");
    return
  }

  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { adminId: user.adminId },
      include: {
        plan: {
          include: {
            offers: true,
            specs: true,
            descriptions: true,
          },
        },
        payments: true,
        events: true,
      },
    });

    const now = new Date();

    const result = await Promise.all(
      subscriptions.map(async (sub) => {
        let newStatus: SubscriptionStatus;

        if (sub.cancelledAt) {
          newStatus = SubscriptionStatus.canceled;
        } else if (isBefore(now, sub.startsAt)) {
          newStatus = SubscriptionStatus.pending;
        } else if (sub.endsAt && isAfter(now, sub.endsAt)) {
          newStatus = SubscriptionStatus.expired;
        } else {
          newStatus = SubscriptionStatus.active;
        }

        if (sub.status !== newStatus) {
          sub = await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: newStatus },
            include: {
              plan: { include: { offers: true, specs: true, descriptions: true } },
              payments: true,
              events: true,
            },
          });
        }

        let timeMessage: string;

        if (sub.status === SubscriptionStatus.expired && sub.endsAt) {
          const daysAgo = differenceInDays(now, sub.endsAt);
          timeMessage = `Expired ${daysAgo} day's ago`;
        }
        else if (sub.endsAt) {
          const remainingDays = differenceInDays(sub.endsAt, now);
          if (remainingDays > 0) {
            timeMessage = `${remainingDays} day's remaining`;
          } else if (isSameDay(sub.endsAt, now)) {
            timeMessage = "Expires today";
          } else {
            timeMessage = "Expired";
          }
        } else {
          timeMessage = "No expiry date set";
        }

        return {
          id: sub.id,
          planId: sub.planId,
          status: sub.status,
          startsAt: sub.startsAt,
          endsAt: sub.endsAt,
          timeMessage,
          plan: sub.plan,
          payments: sub.payments,
          events: sub.events,
        };
      })
    );

    sendSuccessResponse(res, 200, "Subscription info fetched", {
      subscriptions: result,
    });

  } catch (err:any) {
    console.error("error:", err);
    sendErrorResponse(res, err instanceof Error ? 400 : 500, err.message || "Failed fetch data");
  }
}; 
