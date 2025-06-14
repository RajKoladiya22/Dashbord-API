"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAdminAndAssociatedData = exports.approveAdmin = exports.subAdminDetails = exports.listAllAdmins = void 0;
const database_config_1 = require("../../config/database.config");
const responseHandler_1 = require("../../core/utils/responseHandler");
const listAllAdmins = async (req, res, next) => {
    var _a, _b;
    const user = req.user;
    if (!user || user.role !== "super_admin") {
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
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
                { companyName: { contains: q, mode: "insensitive" } },
            ],
        }
        : {};
    const allowedSortFields = ["firstName", "lastName", "email", "companyName"];
    const sortBy = req.query.sortBy || "companyName";
    const sortOrder = ((_b = req.query.sortOrder) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === "asc" ? "asc" : "desc";
    if (!allowedSortFields.includes(sortBy)) {
        (0, responseHandler_1.sendErrorResponse)(res, 400, `Invalid sortBy. Must be one of: ${allowedSortFields.join(", ")}`);
        return;
    }
    let statusFilter = { status: true };
    if (req.query.status === "false") {
        statusFilter.status = false;
    }
    const baseFilter = {
        ...searchFilter,
        ...statusFilter,
    };
    try {
        const [total, admins] = await Promise.all([
            database_config_1.prisma.admin.count({ where: baseFilter }),
            database_config_1.prisma.admin.findMany({
                where: baseFilter,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    companyName: true,
                    contactInfo: true,
                    status: true,
                },
            }),
        ]);
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Admins fetched", {
            admins,
            meta: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (err) {
        console.error("listAllAdmins error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
    }
};
exports.listAllAdmins = listAllAdmins;
const subAdminDetails = async (req, res, next) => {
    const user = req.user;
    const id = req.params.id;
    const query = req.params.query;
    if (!user || user.role !== "super_admin") {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    try {
        if (query === "teammembers") {
            const teammembers = await database_config_1.prisma.teamMember.findMany({
                where: { adminId: id },
                select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    status: true,
                    role: true,
                    department: true,
                    position: true,
                    contactInfo: true,
                    address: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            if (!teammembers || teammembers.length === 0) {
                res.status(404).json({ message: "No team members found" });
                return;
            }
            const adminDetailsWithBackLink = teammembers.map((team) => ({
                ...team,
                backLink: "/api/v1/auth/details",
            }));
            res.status(200).json(adminDetailsWithBackLink);
            return;
        }
        else if (query === "patners") {
            const patners = await database_config_1.prisma.partner.findMany({
                where: {
                    adminId: id
                },
                select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    status: true,
                    role: true,
                    customers: true,
                    contactInfo: true,
                    address: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            if (!patners || patners.length === 0) {
                res.status(404).json({ message: "No patners are found" });
            }
            else {
                const adminDetailsWithBackLink = patners.map((team) => {
                    return {
                        ...team,
                        backLink: '/api/v1/auth/details',
                    };
                });
                res.status(200).json({ data: adminDetailsWithBackLink });
            }
        }
        else if (query === "subscription") {
            const subscription = await database_config_1.prisma.subscription.findMany({
                where: {
                    adminId: id,
                },
                select: {
                    plan: true,
                    planId: true,
                    status: true,
                    startsAt: true,
                    endsAt: true,
                    renewedAt: true,
                    cancelledAt: true,
                    payments: true,
                    events: true,
                },
            });
            if (!subscription || subscription.length === 0) {
                res.status(404).json({ message: "No subscription are found" });
            }
            else {
                const adminDetailsWithBackLink = subscription.map((team) => {
                    return {
                        ...team,
                        backLink: '/api/v1/auth/details',
                    };
                });
                res.status(200).json({ data: adminDetailsWithBackLink });
            }
        }
        else if (query === "products") {
            const products = await database_config_1.prisma.product.findMany({
                where: {
                    adminId: id,
                },
                select: {
                    productName: true,
                    productCategory: true,
                    productPrice: true,
                    description: true,
                    productLink: true,
                    specifications: true,
                    tags: true,
                    status: true,
                    createdAt: true,
                    customerProductHistory: true,
                    renewalHistory: true,
                },
            });
            if (!products || products.length === 0) {
                res.status(404).json({ message: "No products are found" });
            }
            else {
                const adminDetailsWithBackLink = products.map((team) => {
                    return {
                        ...team,
                        backLink: '/api/v1/auth/details',
                    };
                });
                res.status(200).json({ data: adminDetailsWithBackLink });
            }
        }
        else if (query === "customers") {
            console.log("->>>>>>>>..cal query");
            const customer = await database_config_1.prisma.customer.findMany({
                where: {
                    adminId: id,
                },
                select: {
                    companyName: true,
                    contactPerson: true,
                    mobileNumber: true,
                    email: true,
                    serialNo: true,
                    prime: true,
                    blacklisted: true,
                    adminCustomFields: true,
                    createdAt: true,
                    joiningDate: true,
                },
            });
            console.log("-------> cusorm", id, customer);
            if (!customer || customer.length === 0) {
                res.status(404).json({ message: "No customers are found" });
            }
            else {
                const adminDetailsWithBackLink = customer.map((team) => {
                    return {
                        ...team,
                        backLink: '/api/v1/auth/details',
                    };
                });
                res.status(200).json({ data: adminDetailsWithBackLink });
            }
        }
        else if (query === "customerproducthistory") {
            const customerproducthistory = await database_config_1.prisma.customerProductHistory.findMany({
                where: {
                    adminId: id,
                },
                select: {
                    customerId: true,
                    adminId: true,
                    productId: true,
                    purchaseDate: true,
                    renewPeriod: true,
                    expiryDate: true,
                    renewalDate: true,
                    customer: true,
                    product: true,
                },
            });
            if (!customerproducthistory || customerproducthistory.length === 0) {
                res.status(404).json({ message: "No customerproducthistory are found" });
            }
            else {
                const adminDetailsWithBackLink = customerproducthistory.map((team) => {
                    return {
                        ...team,
                        backLink: '/api/v1/auth/details',
                    };
                });
                res.status(200).json({ data: adminDetailsWithBackLink });
            }
        }
        else if (query === "admincustomfield") {
            const admincustomfield = await database_config_1.prisma.adminCustomField.findMany({
                where: {
                    adminId: id,
                },
                select: {
                    fieldName: true,
                    fieldType: true,
                    isRequired: true,
                    options: true,
                    isMultiSelect: true,
                    status: true,
                    createdAt: true,
                },
            });
            if (!admincustomfield || admincustomfield.length === 0) {
                res.status(404).json({ message: "No admincustomfield are found" });
            }
            else {
                const adminDetailsWithBackLink = admincustomfield.map((team) => {
                    return {
                        ...team,
                        backLink: '/api/v1/auth/details',
                    };
                    res.status(200).json({ data: adminDetailsWithBackLink });
                });
            }
        }
        else {
            res.status(404).json({ message: "No Details found" });
        }
    }
    catch (err) {
        console.error("Error listing admin details:", err);
        res.status(500).json({ message: "Server error" });
    }
};
exports.subAdminDetails = subAdminDetails;
const approveAdmin = async (req, res, next) => {
    const user = req.user;
    if (!user || user.role !== "super_admin") {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const adminId = req.params.id;
    const statusRaw = req.body.status;
    let adminStatus = null;
    if (typeof statusRaw === "boolean") {
        adminStatus = statusRaw;
    }
    else if (typeof statusRaw === "string") {
        if (statusRaw.toLowerCase() === "true")
            adminStatus = true;
        else if (statusRaw.toLowerCase() === "false")
            adminStatus = false;
    }
    if (adminStatus === null) {
        (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid status");
        return;
    }
    try {
        const adminDetails = await database_config_1.prisma.admin.findUnique({ where: { id: adminId } });
        if (!adminDetails) {
            (0, responseHandler_1.sendErrorResponse)(res, 404, "Admin not found");
            return;
        }
        await database_config_1.prisma.loginCredential.updateMany({
            where: { userProfileId: adminDetails.id },
            data: {
                status: adminStatus,
            },
        });
        const approvedAdmin = await database_config_1.prisma.admin.update({
            where: { id: adminId },
            data: {
                status: adminStatus,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                status: true,
            },
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Admin Status Updated", approvedAdmin);
    }
    catch (err) {
        console.error("Error updating admin status:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
    }
};
exports.approveAdmin = approveAdmin;
const deleteAdminAndAssociatedData = async (req, res, next) => {
    const user = req.user;
    const adminId = req.params.id;
    if (!user || user.role !== "super_admin") {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    try {
        const adminExists = await database_config_1.prisma.admin.findUnique({ where: { id: adminId } });
        if (!adminExists) {
            (0, responseHandler_1.sendErrorResponse)(res, 404, "Admin not found");
            return;
        }
        await database_config_1.prisma.customerProductHistory.deleteMany({ where: { adminId } });
        await database_config_1.prisma.product.deleteMany({ where: { adminId } });
        await database_config_1.prisma.adminCustomField.deleteMany({ where: { adminId } });
        const subscriptions = await database_config_1.prisma.subscription.findMany({ where: { adminId } });
        for (const subscription of subscriptions) {
            await database_config_1.prisma.subscriptionPayment.deleteMany({ where: { subscriptionId: subscription.id } });
            await database_config_1.prisma.subscriptionEvent.deleteMany({ where: { subscriptionId: subscription.id } });
        }
        await database_config_1.prisma.subscription.deleteMany({ where: { adminId } });
        const partners = await database_config_1.prisma.partner.findMany({ where: { adminId } });
        for (const partner of partners) {
            await database_config_1.prisma.customer.deleteMany({ where: { partnerId: partner.id } });
        }
        await database_config_1.prisma.partner.deleteMany({ where: { adminId } });
        await database_config_1.prisma.teamMember.deleteMany({ where: { adminId } });
        await database_config_1.prisma.customer.deleteMany({ where: { adminId } });
        await database_config_1.prisma.loginCredential.deleteMany({ where: { userProfileId: adminId } });
        await database_config_1.prisma.admin.delete({ where: { id: adminId } });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Admin and all associated data deleted successfully");
    }
    catch (error) {
        console.error("Error deleting admin and associated data:", error);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Internal server error");
    }
};
exports.deleteAdminAndAssociatedData = deleteAdminAndAssociatedData;
//# sourceMappingURL=superAdmin.controller.js.map