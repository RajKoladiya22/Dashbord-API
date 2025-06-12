"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.currentPlan = void 0;
const database_config_1 = require("../../config/database.config");
const responseHandler_1 = require("../../core/utils/responseHandler");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const currentPlan = async (req, res, next) => {
    const user = req.user;
    if (!user || user.role !== "admin") {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    try {
        const subscriptions = await database_config_1.prisma.subscription.findMany({
            where: { adminId: user.adminId },
        });
        const now = new Date();
        const result = await Promise.all(subscriptions.map(async (sub) => {
            let newStatus;
            if (sub.cancelledAt) {
                newStatus = client_1.SubscriptionStatus.canceled;
            }
            else if ((0, date_fns_1.isBefore)(now, sub.startsAt)) {
                newStatus = client_1.SubscriptionStatus.pending;
            }
            else if (sub.endsAt && (0, date_fns_1.isAfter)(now, sub.endsAt)) {
                newStatus = client_1.SubscriptionStatus.expired;
            }
            else {
                newStatus = client_1.SubscriptionStatus.active;
            }
            if (sub.status !== newStatus) {
                sub = await database_config_1.prisma.subscription.update({
                    where: { id: sub.id },
                    data: { status: newStatus },
                });
            }
            let timeMessage;
            if (sub.status === client_1.SubscriptionStatus.expired && sub.endsAt) {
                const daysAgo = (0, date_fns_1.differenceInDays)(now, sub.endsAt);
                timeMessage = `Expired ${daysAgo} day's ago`;
            }
            else if (sub.endsAt) {
                const remainingDays = (0, date_fns_1.differenceInDays)(sub.endsAt, now);
                if (remainingDays > 0) {
                    timeMessage = `${remainingDays} day's remaining`;
                }
                else if ((0, date_fns_1.isSameDay)(sub.endsAt, now)) {
                    timeMessage = "Expires today";
                }
                else {
                    timeMessage = "Expired";
                }
            }
            else {
                timeMessage = "No expiry date set";
            }
            return {
                id: sub.id,
                planId: sub.planId,
                status: sub.status,
                startsAt: sub.startsAt,
                endsAt: sub.endsAt,
                timeMessage,
            };
        }));
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Subscription info fetched", {
            subscriptions: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.currentPlan = currentPlan;
//# sourceMappingURL=currentPlan.controller.js.map