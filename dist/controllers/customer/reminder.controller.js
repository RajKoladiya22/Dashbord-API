"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listRenewalReminders = void 0;
const database_config_1 = require("../../config/database.config");
const responseHandler_1 = require("../../core/utils/responseHandler");
const dayjs_1 = __importDefault(require("dayjs"));
function computeWindow(window, customStart, customEnd) {
    const today = (0, dayjs_1.default)().startOf("day");
    let start;
    let end;
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
                throw new Error("For custom window, both startDate and endDate must be provided");
            }
            start = (0, dayjs_1.default)(customStart);
            end = (0, dayjs_1.default)(customEnd);
            break;
        default:
            start = today;
            end = today.add(15, "day");
    }
    return { start: start.toDate(), end: end.toDate() };
}
const listRenewalReminders = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user || !user.adminId) {
            (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
            return;
        }
        const adminId = user.role === "admin" ? user.id : user.adminId;
        const { window = "next15", startDate, endDate, productName, } = req.query;
        let range;
        try {
            range = computeWindow(window, startDate, endDate);
        }
        catch (err) {
            (0, responseHandler_1.sendErrorResponse)(res, 400, err.message);
            return;
        }
        const where = {
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
        const reminders = await database_config_1.prisma.customerProductHistory.findMany({
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
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Renewal reminders fetched", { reminders });
        return;
    }
    catch (err) {
        console.error("listRenewalReminders error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
        return;
    }
};
exports.listRenewalReminders = listRenewalReminders;
//# sourceMappingURL=reminder.controller.js.map