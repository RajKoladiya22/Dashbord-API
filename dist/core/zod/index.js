"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPartnerSchema = exports.signUpSchema = exports.signInSchema = void 0;
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
//# sourceMappingURL=index.js.map