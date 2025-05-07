"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCustomer = exports.listCustomers = exports.createCustomer = void 0;
const database_config_1 = require("../../config/database.config");
const zod_1 = require("zod");
const responseHandler_1 = require("../../core/utils/responseHandler");
const createCustomerSchema = zod_1.z.object({
    companyName: zod_1.z.string().min(1),
    contactPerson: zod_1.z.string().min(1),
    mobileNumber: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    serialNo: zod_1.z.string().optional(),
    prime: zod_1.z.boolean().optional(),
    blacklisted: zod_1.z.boolean().optional(),
    remark: zod_1.z.string().optional(),
    hasReference: zod_1.z.boolean().optional(),
    partnerId: zod_1.z.string().uuid().optional(),
    adminCustomFields: zod_1.z.record(zod_1.z.any()).optional(),
    address: zod_1.z.record(zod_1.z.any()),
    joiningDate: zod_1.z.string(),
    products: zod_1.z
        .array(zod_1.z.object({
        productId: zod_1.z.string().uuid(),
        expiryDate: zod_1.z.string().optional(),
    }))
        .optional(),
});
const updateCustomerSchema = zod_1.z.object({
    companyName: zod_1.z.string().min(1).optional(),
    contactPerson: zod_1.z.string().min(1).optional(),
    mobileNumber: zod_1.z.string().min(1).optional(),
    email: zod_1.z.string().email().optional(),
    serialNo: zod_1.z.string().optional(),
    prime: zod_1.z.boolean().optional(),
    blacklisted: zod_1.z.boolean().optional(),
    remark: zod_1.z.string().optional(),
    hasReference: zod_1.z.boolean().optional(),
    partnerId: zod_1.z.string().uuid().optional(),
    adminCustomFields: zod_1.z.record(zod_1.z.any()).optional(),
    address: zod_1.z.record(zod_1.z.any()).optional(),
    joiningDate: zod_1.z.string().optional(),
});
const createCustomer = async (req, res, next) => {
    console.log("req.body----->\n", req.body);
    const { companyName, contactPerson, mobileNumber, email, serialNo, prime = false, blacklisted = false, remark, hasReference = false, partnerId: incomingPartnerId, adminCustomFields, address, joiningDate, products = [], } = req.body;
    const user = req.user;
    if (!user) {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const adminId = user.role === "admin" ? user.id : user.adminId;
    const partnerId = user.role === "partner" ? user.id : incomingPartnerId;
    const rawCustomFields = adminCustomFields;
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
                    joiningDate: new Date(joiningDate),
                },
            });
            console.log("customer----->\n", customer);
            const now = new Date();
            const historyCreates = products.map((p) => tx.customerProductHistory.create({
                data: {
                    customerId: customer.id,
                    adminId,
                    productId: p.productDetailId,
                    purchaseDate: p.purchaseDate,
                    status: true,
                    renewal: p.renewal ? p.renewal : false,
                    expiryDate: p.expiryDate ? new Date(p.expiryDate) : undefined,
                    renewalDate: p.renewalDate ? new Date(p.renewalDate) : undefined,
                },
            }));
            const history = await Promise.all(historyCreates);
            return { customer, history };
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 201, "Customer created", {
            customers: result.customer,
            history: result.history,
        });
        return;
    }
    catch (err) {
        console.error("createCustomer error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
        return;
    }
};
exports.createCustomer = createCustomer;
const listCustomers = async (req, res, next) => {
    const user = req.user;
    if (!user) {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const baseFilter = {};
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
            baseFilter.adminId = user.adminId;
            break;
        default:
            (0, responseHandler_1.sendErrorResponse)(res, 403, "Forbidden");
            return;
    }
    try {
        const customers = await database_config_1.prisma.customer.findMany({
            where: baseFilter,
            orderBy: { createdAt: "desc" },
            include: {
                partner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        companyName: true,
                    },
                },
                history: {
                    include: { product: true },
                },
            },
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Customers fetched", { customers });
        return;
    }
    catch (err) {
        console.error("listCustomers error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
        return;
    }
};
exports.listCustomers = listCustomers;
const updateCustomer = async (req, res, next) => {
    const customerId = req.params.id;
    const parsed = updateCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
        (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid input", {
            errors: parsed.error.errors,
        });
        return;
    }
    const { companyName, contactPerson, mobileNumber, email, serialNo, prime, blacklisted, remark, hasReference, partnerId: incomingPartnerId, adminCustomFields, address, joiningDate, } = parsed.data;
    const user = req.user;
    if (!user) {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const adminId = user.role === "admin" ? user.id : user.adminId;
    const partnerId = user.role === "partner" ? user.id : incomingPartnerId;
    try {
        const result = await database_config_1.prisma.$transaction(async (tx) => {
            const customer = await tx.customer.update({
                where: { id: customerId, adminId: adminId },
                data: {
                    ...(companyName !== undefined && { companyName }),
                    ...(contactPerson !== undefined && { contactPerson }),
                    ...(mobileNumber !== undefined && { mobileNumber }),
                    ...(email !== undefined && { email }),
                    ...(serialNo !== undefined && { serialNo }),
                    ...(prime !== undefined && { prime }),
                    ...(blacklisted !== undefined && { blacklisted }),
                    ...(remark !== undefined && { remark }),
                    ...(hasReference !== undefined && { hasReference }),
                    ...(partnerId !== undefined && { partnerId }),
                    ...(adminCustomFields !== undefined && { adminCustomFields }),
                    ...(address !== undefined && { address }),
                    ...(joiningDate !== undefined && {
                        joiningDate: new Date(joiningDate),
                    }),
                },
            });
            return customer;
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Customer updated", {
            customer: result,
        });
    }
    catch (err) {
        console.error("updateCustomer error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
    }
};
exports.updateCustomer = updateCustomer;
//# sourceMappingURL=customer.controller.js.map