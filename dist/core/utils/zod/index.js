"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPlanSchema = exports.statusSchema = exports.listPlansQuery = exports.createCustomFieldSchema = exports.updateCustomFieldSchema = exports.updateHistorySchema = exports.updateCustomerSchema = exports.createCustomerSchema = exports.signUpSuperAdminSchema = exports.createProductSchema = exports.createTeamMemberSchema = exports.createPartnerSchema = exports.signUpSchema = exports.signInSchema = void 0;
const zod_1 = require("zod");
exports.signInSchema = zod_1.z.object({
    identifier: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
exports.signUpSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    contactNumber: zod_1.z.string().optional(),
    companyName: zod_1.z.string().min(1),
    address: zod_1.z.any().optional(),
});
exports.createPartnerSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1),
    companyName: zod_1.z.string().min(1),
    contact_info: zod_1.z.record(zod_1.z.any()).optional(),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
});
exports.createTeamMemberSchema = zod_1.z.object({
    adminId: zod_1.z.string().uuid(),
    full_name: zod_1.z.string().min(1),
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    department: zod_1.z.string().optional(),
    position: zod_1.z.string().optional(),
    role: zod_1.z.enum(["team_member", "sub_admin"]),
    status: zod_1.z.string().default("active"),
    contactInfo: zod_1.z
        .object({ phone: zod_1.z.string().optional(), email: zod_1.z.string().optional() })
        .optional(),
    address: zod_1.z
        .object({
        street: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        state: zod_1.z.string().optional(),
        zip: zod_1.z.string().optional(),
    })
        .optional(),
});
exports.createProductSchema = zod_1.z.object({
    product_name: zod_1.z.string().min(1),
    product_category: zod_1.z.record(zod_1.z.any()),
    product_price: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    product_link: zod_1.z.string().url().optional(),
    tags: zod_1.z.array(zod_1.z.string()),
    specifications: zod_1.z.record(zod_1.z.any()),
});
exports.signUpSuperAdminSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    contactNumber: zod_1.z.string().optional(),
    address: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.createCustomerSchema = zod_1.z.object({
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
exports.updateCustomerSchema = zod_1.z.object({
    companyName: zod_1.z.string().optional(),
    contactPerson: zod_1.z.string().optional(),
    mobileNumber: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
    serialNo: zod_1.z.string().optional(),
    prime: zod_1.z.boolean().optional(),
    blacklisted: zod_1.z.boolean().optional(),
    remark: zod_1.z.string().optional(),
    hasReference: zod_1.z.boolean().optional(),
    partnerId: zod_1.z.string().uuid().nullable().optional(),
    adminCustomFields: zod_1.z.record(zod_1.z.any()).optional(),
    address: zod_1.z.record(zod_1.z.any()).optional(),
    joiningDate: zod_1.z.string().optional(),
    product: zod_1.z
        .array(zod_1.z.object({
        productId: zod_1.z.string().uuid(),
        purchaseDate: zod_1.z.string(),
        renewal: zod_1.z.boolean().optional(),
        expiryDate: zod_1.z.string().optional(),
        renewalDate: zod_1.z.string().optional(),
        details: zod_1.z.string().optional(),
        renewPeriod: zod_1.z.enum(["monthly", "quarterly", "half_yearly", "yearly", "custom"]).optional(),
    }))
        .optional(),
});
exports.updateHistorySchema = zod_1.z.object({
    purchaseDate: zod_1.z.string().optional(),
    renewal: zod_1.z.boolean().optional(),
    expiryDate: zod_1.z.string().optional(),
    renewalDate: zod_1.z.string().optional(),
    status: zod_1.z.boolean().optional(),
});
exports.updateCustomFieldSchema = zod_1.z.object({
    fieldName: zod_1.z.string().min(1).optional(),
    fieldType: zod_1.z.string().min(1).optional(),
    isRequired: zod_1.z.boolean().optional(),
    options: zod_1.z.array(zod_1.z.string()).optional(),
    isMultiSelect: zod_1.z.boolean().optional(),
});
exports.createCustomFieldSchema = zod_1.z.object({
    fieldName: zod_1.z.string().min(1),
    fieldType: zod_1.z.string().min(1),
    isRequired: zod_1.z.boolean().optional(),
    options: zod_1.z.array(zod_1.z.string()).optional(),
    isMultiSelect: zod_1.z.boolean().optional(),
});
exports.listPlansQuery = zod_1.z.object({
    status: zod_1.z.string().optional().transform(s => s === "false" ? false : true),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(10),
});
exports.statusSchema = zod_1.z.object({ status: zod_1.z.boolean() });
exports.createPlanSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Plan name is required"),
    duration: zod_1.z.string().min(1, "Duration is required"),
    price: zod_1.z.number().nonnegative("Price must be ≥ 0"),
    offers: zod_1.z
        .array(zod_1.z.object({
        offerType: zod_1.z.enum(["percentage", "fixed", "free_trial"]),
        value: zod_1.z.number().optional(),
        startsAt: zod_1.z.string().optional(),
        endsAt: zod_1.z.string().optional(),
    }))
        .optional(),
    specs: zod_1.z
        .array(zod_1.z.object({
        specName: zod_1.z.string().min(1),
        specValue: zod_1.z.string().min(1),
    }))
        .optional(),
    descriptions: zod_1.z
        .array(zod_1.z.object({
        content: zod_1.z.string().min(1),
    }))
        .optional(),
});
//# sourceMappingURL=index.js.map