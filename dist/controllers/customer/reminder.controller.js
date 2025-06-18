"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCustomerProduct = exports.listRenewalReminders = void 0;
const database_config_1 = require("../../config/database.config");
const responseHandler_1 = require("../../core/utils/responseHandler");
const dayjs_1 = __importDefault(require("dayjs"));
const zod_1 = require("../../core/utils/zod");
const dateHelpers_1 = require("../../core/utils/helper/dateHelpers");
function computeWindow(window, customStart, customEnd) {
    const today = (0, dayjs_1.default)().startOf("day");
    let start;
    let end;
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
        const partnerId = user.role === "partner" ? user.id : undefined;
        const { timeWindow = "next15", startDate, endDate, productName, customerSearch, partnerSearch, } = req.query;
        let range;
        try {
            range = computeWindow(timeWindow, startDate, endDate);
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
        if (partnerId) {
            where.customer = { is: { partnerId } };
        }
        if (productName) {
            where.product = {
                productName: {
                    contains: productName,
                    mode: "insensitive",
                },
            };
        }
        if (customerSearch) {
            where.customer = {
                is: {
                    OR: [
                        { companyName: { contains: customerSearch, mode: "insensitive" } },
                        {
                            contactPerson: { contains: customerSearch, mode: "insensitive" },
                        },
                    ],
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
        }
        else if (partnerSearch) {
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
        const reminders = await database_config_1.prisma.customerProductHistory.findMany({
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
const updateCustomerProduct = async (req, res, next) => {
    var _a;
    const historyId = req.params.id;
    if (!historyId) {
        (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid input");
        return;
    }
    const parsed = zod_1.updateHistorySchema.safeParse(req.body);
    if (!parsed.success) {
        (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid input", {
            errors: parsed.error.errors,
        });
        return;
    }
    const data = parsed.data;
    const mode = ((_a = req.query.mode) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "autofill"
        ? "autofill"
        : "manual";
    const user = req.user;
    if (!user) {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const adminId = user.role === "admin" ? user.id : user.adminId;
    try {
        const existing = await database_config_1.prisma.customerProductHistory.findUnique({
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
        if (!existing || existing.adminId !== adminId) {
            (0, responseHandler_1.sendErrorResponse)(res, 404, "History entry not found or renewal canceled");
            return;
        }
        let updateData = {};
        if (mode === "autofill") {
            if (!existing.renewalDate) {
                (0, responseHandler_1.sendErrorResponse)(res, 400, "Cannot autofill renewal dates because renewalDate is missing");
                return;
            }
            const purchase = new Date(existing.renewalDate);
            let renewalDate;
            let expiryDate;
            switch (existing.renewPeriod) {
                case "monthly":
                    renewalDate = (0, dateHelpers_1.addMonths)(purchase, 1);
                    expiryDate = new Date(renewalDate);
                    expiryDate.setDate(expiryDate.getDate() - 1);
                    break;
                case "quarterly":
                    renewalDate = (0, dateHelpers_1.addMonths)(purchase, 3);
                    expiryDate = new Date(renewalDate);
                    expiryDate.setDate(expiryDate.getDate() - 1);
                    break;
                case "half_yearly":
                    renewalDate = (0, dateHelpers_1.addMonths)(purchase, 6);
                    expiryDate = new Date(renewalDate);
                    expiryDate.setDate(expiryDate.getDate() - 1);
                    break;
                case "yearly":
                    renewalDate = (0, dateHelpers_1.addYears)(purchase, 1);
                    expiryDate = new Date(renewalDate);
                    expiryDate.setDate(expiryDate.getDate() - 1);
                    break;
                case "custom":
                default:
                    (0, responseHandler_1.sendErrorResponse)(res, 400, "Autofill not applicable for custom period");
                    return;
            }
            updateData = {
                purchaseDate: purchase,
                expiryDate: expiryDate,
                renewalDate: renewalDate,
                renewal: true,
            };
        }
        else {
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
        const reminders = await database_config_1.prisma.customerProductHistory.update({
            where: { id: historyId },
            data: updateData,
        });
        const renewalRecord = await database_config_1.prisma.productRenewalHistory.create({
            data: {
                customerProductHistoryId: historyId,
                productId: existing.productId,
                purchaseDate: existing.purchaseDate,
                expiryDate: existing.expiryDate,
                renewalDate: existing.renewalDate,
            },
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, `Product history updated (${mode})`, {
            reminders,
        });
    }
    catch (err) {
        console.error("updateCustomerProduct error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
    }
};
exports.updateCustomerProduct = updateCustomerProduct;
//# sourceMappingURL=reminder.controller.js.map