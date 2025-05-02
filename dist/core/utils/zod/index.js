"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProductSchema = exports.createTeamMemberSchema = exports.createPartnerSchema = exports.signUpSchema = exports.signInSchema = void 0;
const zod_1 = require("zod");
exports.signInSchema = zod_1.z.object({
    identifier: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
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
    partner_name: zod_1.z.string().min(1),
    company_name: zod_1.z.string().min(1),
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
//# sourceMappingURL=index.js.map