import { z } from "zod";
export declare const signInSchema: z.ZodObject<{
    identifier: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    identifier: string;
    password: string;
}, {
    identifier: string;
    password: string;
}>;
export type SignInSchema = z.infer<typeof signInSchema>;
export declare const signUpSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    contactNumber: z.ZodOptional<z.ZodString>;
    companyName: z.ZodString;
    address: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    email: string;
    companyName: string;
    password: string;
    address?: any;
    contactNumber?: string | undefined;
}, {
    firstName: string;
    lastName: string;
    email: string;
    companyName: string;
    password: string;
    address?: any;
    contactNumber?: string | undefined;
}>;
export type SignUpSchema = z.infer<typeof signUpSchema>;
export declare const createPartnerSchema: z.ZodObject<{
    partner_name: z.ZodString;
    company_name: z.ZodString;
    contact_info: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    partner_name: string;
    company_name: string;
    contact_info?: Record<string, any> | undefined;
}, {
    email: string;
    password: string;
    partner_name: string;
    company_name: string;
    contact_info?: Record<string, any> | undefined;
}>;
export type CreatePartnerInput = z.infer<typeof createPartnerSchema>;
export declare const createTeamMemberSchema: z.ZodObject<{
    adminId: z.ZodString;
    full_name: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    department: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodString>;
    contactInfo: z.ZodOptional<z.ZodObject<{
        phone: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email?: string | undefined;
        phone?: string | undefined;
    }, {
        email?: string | undefined;
        phone?: string | undefined;
    }>>;
    address: z.ZodOptional<z.ZodObject<{
        street: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        state: z.ZodOptional<z.ZodString>;
        zip: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        street?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        zip?: string | undefined;
    }, {
        street?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        zip?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    adminId: string;
    password: string;
    full_name: string;
    address?: {
        street?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        zip?: string | undefined;
    } | undefined;
    contactInfo?: {
        email?: string | undefined;
        phone?: string | undefined;
    } | undefined;
    department?: string | undefined;
    position?: string | undefined;
}, {
    firstName: string;
    lastName: string;
    email: string;
    adminId: string;
    password: string;
    full_name: string;
    address?: {
        street?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        zip?: string | undefined;
    } | undefined;
    contactInfo?: {
        email?: string | undefined;
        phone?: string | undefined;
    } | undefined;
    status?: string | undefined;
    department?: string | undefined;
    position?: string | undefined;
}>;
export type CreateTeamMemberBody = z.infer<typeof createTeamMemberSchema>;
export declare const createProductSchema: z.ZodObject<{
    product_name: z.ZodString;
    product_category: z.ZodRecord<z.ZodString, z.ZodAny>;
    product_price: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    product_link: z.ZodOptional<z.ZodString>;
    tags: z.ZodArray<z.ZodString, "many">;
    specifications: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    tags: string[];
    specifications: Record<string, any>;
    product_name: string;
    product_category: Record<string, any>;
    product_price: string;
    description?: string | undefined;
    product_link?: string | undefined;
}, {
    tags: string[];
    specifications: Record<string, any>;
    product_name: string;
    product_category: Record<string, any>;
    product_price: string;
    description?: string | undefined;
    product_link?: string | undefined;
}>;
export type CreateProductBody = z.infer<typeof createProductSchema>;
