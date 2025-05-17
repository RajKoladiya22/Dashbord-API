"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCustomer = exports.setCustomerStatus = exports.updateCustomer = exports.listCustomers = exports.createCustomer = void 0;
const database_config_1 = require("../../config/database.config");
const date_fns_1 = require("date-fns");
const responseHandler_1 = require("../../core/utils/responseHandler");
const zod_1 = require("../../core/utils/zod");
const client_1 = require("@prisma/client");
const dateHelpers_1 = require("../../core/utils/helper/dateHelpers");
const createCustomer = async (req, res, next) => {
    const { companyName, contactPerson, mobileNumber, email, serialNo, prime = false, blacklisted = false, remark, hasReference = false, partnerId: incomingPartnerId, adminCustomFields, address, joiningDate, products = [], } = req.body;
    const user = req.user;
    if (!user) {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const adminId = user.role === "admin" ? user.id : user.adminId;
    const partnerId = user.role === "partner" ? user.id : incomingPartnerId;
    try {
        const result = await database_config_1.prisma.$transaction(async (tx) => {
            const customer = await tx.customer.create({
                data: {
                    adminId,
                    partnerId,
                    companyName,
                    contactPerson,
                    mobileNumber,
                    email,
                    serialNo,
                    prime,
                    blacklisted,
                    remark,
                    hasReference,
                    adminCustomFields,
                    address,
                    joiningDate: (0, date_fns_1.parseISO)(joiningDate),
                },
            });
            let history = [];
            const now = new Date();
            if (products) {
                const historyCreates = products.map((p) => {
                    var _a;
                    const purchase = new Date(p.purchaseDate);
                    let renewalDate;
                    let expiryDate;
                    switch (p.renewPeriod) {
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
                            renewalDate = p.renewalDate ? new Date(p.renewalDate) : undefined;
                            expiryDate = p.expiryDate ? new Date(p.expiryDate) : undefined;
                            break;
                    }
                    return tx.customerProductHistory.create({
                        data: {
                            customerId: customer.id,
                            adminId,
                            productId: p.productDetailId,
                            purchaseDate: purchase,
                            status: true,
                            renewPeriod: p.renewPeriod,
                            renewal: (_a = p.renewal) !== null && _a !== void 0 ? _a : false,
                            renewalDate,
                            expiryDate,
                        },
                    });
                });
                history = await Promise.all(historyCreates);
            }
            return { customer, history };
        });
        const sanitized = {
            ...result.customer,
            product: result.history
        };
        (0, responseHandler_1.sendSuccessResponse)(res, 201, "Customer created", {
            customer: sanitized,
        });
        return;
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            err.code === "P2002") {
            (0, responseHandler_1.sendErrorResponse)(res, 409, "Mobile number or email already in use");
            return;
        }
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            err.code === "P2003") {
            (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid partnerId");
            return;
        }
        console.error("createCustomer error:", err);
        if (!res.headersSent)
            next(err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
        return;
    }
};
exports.createCustomer = createCustomer;
const listCustomers = async (req, res, next) => {
    var _a, _b;
    const user = req.user;
    if (!user) {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const q = (_a = req.query.q) === null || _a === void 0 ? void 0 : _a.trim();
    const searchFilter = q
        ? {
            OR: [
                { companyName: { contains: q, mode: "insensitive" } },
                { contactPerson: { contains: q, mode: "insensitive" } },
                { mobileNumber: { contains: q, mode: "insensitive" } },
                { serialNo: { contains: q, mode: "insensitive" } },
            ],
        }
        : {};
    const allowedSortFields = [
        "companyName",
        "contactPerson",
        "mobileNumber",
        "serialNo",
    ];
    const sortBy = req.query.sortBy || "companyName";
    const sortOrder = ((_b = req.query.sortOrder) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "desc" ? "desc" : "asc";
    if (!allowedSortFields.includes(sortBy)) {
        (0, responseHandler_1.sendErrorResponse)(res, 400, `Invalid sortBy. Must be one of: ${allowedSortFields.join(", ")}`);
        return;
    }
    let statusFilter = { status: true };
    if (req.query.status === "false") {
        statusFilter.status = false;
    }
    const baseFilter = { ...searchFilter, ...statusFilter };
    switch (user.role) {
        case "admin":
        case "super_admin":
            baseFilter.adminId = user.id;
            break;
        case "partner":
            baseFilter.adminId = user.adminId;
            baseFilter.partnerId = user.id;
            break;
        case "team_member":
        case "sub_admin":
            baseFilter.adminId = user.adminId;
            break;
        default:
            (0, responseHandler_1.sendErrorResponse)(res, 403, "Forbidden");
            return;
    }
    try {
        const [total, customers] = await Promise.all([
            database_config_1.prisma.customer.count({ where: baseFilter }),
            database_config_1.prisma.customer.findMany({
                where: baseFilter,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    partner: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            companyName: true,
                            contactInfo: true,
                            email: true,
                            address: true,
                            status: true,
                        },
                    },
                    history: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    productName: true,
                                    productPrice: true,
                                    status: true,
                                },
                            },
                            renewals: {
                                select: {
                                    id: true,
                                    purchaseDate: true,
                                    renewalDate: true,
                                    expiryDate: true,
                                },
                                orderBy: { purchaseDate: "desc" },
                            },
                        },
                    },
                },
            }),
        ]);
        const sanitized = customers.map((cust) => ({
            id: cust.id,
            companyName: cust.companyName,
            contactPerson: cust.contactPerson,
            mobileNumber: cust.mobileNumber,
            email: cust.email,
            serialNo: cust.serialNo,
            prime: cust.prime,
            blacklisted: cust.blacklisted,
            remark: cust.remark,
            address: cust.address,
            adminCustomFields: cust.adminCustomFields,
            joiningDate: cust.joiningDate,
            hasReference: cust.hasReference,
            status: cust.status,
            partner: cust.partner,
            createdAt: cust.createdAt,
            product: cust.history.map((h) => {
                var _a;
                return ({
                    productDetails: h.product,
                    id: h.id,
                    renewPeriod: h.renewPeriod,
                    purchaseDate: h.purchaseDate,
                    expiryDate: h.expiryDate,
                    renewalDate: h.renewalDate,
                    renewal: h.renewal,
                    status: h.status,
                    history: (_a = h.renewals) !== null && _a !== void 0 ? _a : null,
                });
            }),
        }));
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Customers fetched", {
            customers: sanitized,
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (err) {
        console.error("listCustomers error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
    }
};
exports.listCustomers = listCustomers;
const updateCustomer = async (req, res, next) => {
    const customerId = req.params.id;
    const parsed = zod_1.updateCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
        console.error("Validation failed with errors: ", parsed.error.errors);
        (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid input", {
            errors: parsed.error.errors,
        });
        return;
    }
    const { product, ...customerData } = parsed.data;
    const user = req.user;
    if (!user) {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const adminId = user.role === "admin" ? user.id : user.adminId;
    try {
        const result = await database_config_1.prisma.$transaction(async (tx) => {
            const updatedCustomer = await tx.customer.update({
                where: {
                    id: customerId,
                    adminId,
                },
                data: {
                    ...(customerData.companyName !== undefined && {
                        companyName: customerData.companyName,
                    }),
                    ...(customerData.contactPerson !== undefined && {
                        contactPerson: customerData.contactPerson,
                    }),
                    ...(customerData.mobileNumber !== undefined && {
                        mobileNumber: customerData.mobileNumber,
                    }),
                    ...(customerData.email !== undefined && {
                        email: customerData.email,
                    }),
                    ...(customerData.serialNo !== undefined && {
                        serialNo: customerData.serialNo,
                    }),
                    ...(customerData.prime !== undefined && {
                        prime: customerData.prime,
                    }),
                    ...(customerData.blacklisted !== undefined && {
                        blacklisted: customerData.blacklisted,
                    }),
                    ...(customerData.remark !== undefined && {
                        remark: customerData.remark,
                    }),
                    ...(customerData.hasReference !== undefined && {
                        hasReference: customerData.hasReference,
                    }),
                    ...(customerData.partnerId !== undefined && {
                        partnerId: customerData.partnerId,
                    }),
                    ...(customerData.adminCustomFields !== undefined && {
                        adminCustomFields: customerData.adminCustomFields,
                    }),
                    ...(customerData.address !== undefined && {
                        address: customerData.address,
                    }),
                    ...(customerData.joiningDate !== undefined && {
                        joiningDate: new Date(customerData.joiningDate),
                    }),
                },
            });
            let createdHistory = [];
            if (Array.isArray(product) && product.length > 0) {
                createdHistory = await Promise.all(product.map((p) => {
                    var _a, _b;
                    const purchase = new Date(p.purchaseDate);
                    let renewalDate;
                    let expiryDate;
                    const period = (_a = p.renewPeriod) !== null && _a !== void 0 ? _a : "custom";
                    switch (period) {
                        case "monthly":
                            renewalDate = (0, dateHelpers_1.addMonths)(purchase, 1);
                            break;
                        case "quarterly":
                            renewalDate = (0, dateHelpers_1.addMonths)(purchase, 3);
                            break;
                        case "half_yearly":
                            renewalDate = (0, dateHelpers_1.addMonths)(purchase, 6);
                            break;
                        case "yearly":
                            renewalDate = (0, dateHelpers_1.addYears)(purchase, 1);
                            break;
                        default:
                            renewalDate = p.renewalDate
                                ? new Date(p.renewalDate)
                                : undefined;
                            expiryDate = p.expiryDate ? new Date(p.expiryDate) : undefined;
                    }
                    if (renewalDate && !expiryDate) {
                        expiryDate = new Date(renewalDate);
                        expiryDate.setDate(expiryDate.getDate() - 1);
                    }
                    return tx.customerProductHistory.create({
                        data: {
                            customerId,
                            adminId,
                            productId: p.productId,
                            purchaseDate: purchase,
                            status: true,
                            renewPeriod: period,
                            renewal: (_b = p.renewal) !== null && _b !== void 0 ? _b : false,
                            renewalDate,
                            expiryDate,
                        },
                    });
                }));
            }
            return { updatedCustomer, createdHistory };
        });
        const sanitized = {
            ...result.updatedCustomer,
            ...result.createdHistory,
        };
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Customer updated", {
            customer: sanitized,
        });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2002")
                (0, responseHandler_1.sendErrorResponse)(res, 409, "Duplicate field");
            if (err.code === "P2016")
                (0, responseHandler_1.sendErrorResponse)(res, 404, "Record not found");
        }
        console.error(err);
        if (!res.headersSent)
            next(err);
        else
            (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
    }
};
exports.updateCustomer = updateCustomer;
const setCustomerStatus = async (req, res, next) => {
    const customerId = req.params.id;
    const { status } = req.body;
    const user = req.user;
    if (!user) {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const baseFilter = { id: customerId };
    switch (user.role) {
        case "admin":
        case "super_admin":
            baseFilter.adminId = user.id;
            break;
        case "partner":
            baseFilter.adminId = user.adminId;
            baseFilter.partnerId = user.id;
            break;
        case "team_member":
        case "sub_admin":
            baseFilter.adminId = user.adminId;
            break;
        default:
            (0, responseHandler_1.sendErrorResponse)(res, 403, "Forbidden");
            return;
    }
    try {
        const customer = await database_config_1.prisma.$transaction(async (tx) => {
            const updatedCustomer = await tx.customer.update({
                where: baseFilter,
                data: { status },
            });
            if (!updatedCustomer) {
                throw new Error("Customer not found or not in your scope");
            }
            const updatedHistory = await tx.customerProductHistory.updateMany({
                where: { customerId },
                data: { status },
            });
            return updatedCustomer;
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Status updated", { customer });
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2025")
                (0, responseHandler_1.sendErrorResponse)(res, 404, "Customer not found");
            if (err.code === "P2003")
                (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid scope or foreign key");
        }
        console.error("setCustomerStatus error:", err);
        if (!res.headersSent)
            next(err);
        else
            (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
    }
};
exports.setCustomerStatus = setCustomerStatus;
const deleteCustomer = async (req, res, next) => {
    const customerId = req.params.id;
    const user = req.user;
    if (!user) {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const baseFilter = { id: customerId };
    switch (user.role) {
        case "admin":
        case "super_admin":
            baseFilter.adminId = user.id;
            break;
        case "partner":
            baseFilter.adminId = user.adminId;
            baseFilter.partnerId = user.id;
            break;
        case "team_member":
        case "sub_admin":
            baseFilter.adminId = user.adminId;
            break;
        default:
            (0, responseHandler_1.sendErrorResponse)(res, 403, "Forbidden");
            return;
    }
    try {
        const result = await database_config_1.prisma.$transaction(async (tx) => {
            const histories = await tx.customerProductHistory.findMany({
                where: { customerId },
            });
            const historyIds = histories.map((h) => h.id);
            const delRenewals = await tx.productRenewalHistory.deleteMany({
                where: { customerProductHistoryId: { in: historyIds } },
            });
            const delHistory = await tx.customerProductHistory.deleteMany({
                where: { customerId },
            });
            const delCustomer = await tx.customer.deleteMany({
                where: baseFilter,
            });
            return {
                renewalRecordsDeleted: delRenewals.count,
                historyRecordsDeleted: delHistory.count,
                customersDeleted: delCustomer.count,
            };
        });
        if (result.customersDeleted === 0) {
            (0, responseHandler_1.sendErrorResponse)(res, 404, "Customer not found or not in your scope");
            return;
        }
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Customer deleted", {
            customer: {
                id: customerId,
                renewalRecordsDeleted: result.renewalRecordsDeleted,
                historyRecordsDeleted: result.historyRecordsDeleted,
                customersDeleted: result.customersDeleted,
            },
        });
    }
    catch (err) {
        console.error("deleteCustomer error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
    }
};
exports.deleteCustomer = deleteCustomer;
//# sourceMappingURL=customer.controller.js.map