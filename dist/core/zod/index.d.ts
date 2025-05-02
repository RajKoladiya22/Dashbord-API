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
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    companyName: string;
    contactNumber?: string | undefined;
    address?: any;
}, {
    password: string;
    firstName: string;
    lastName: string;
    email: string;
    companyName: string;
    contactNumber?: string | undefined;
    address?: any;
}>;
export type SignUpSchema = z.infer<typeof signUpSchema>;
export declare const createPartnerSchema: z.ZodObject<{
    partner_name: z.ZodString;
    company_name: z.ZodString;
    contact_info: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
    partner_name: string;
    company_name: string;
    contact_info?: Record<string, any> | undefined;
}, {
    password: string;
    email: string;
    partner_name: string;
    company_name: string;
    contact_info?: Record<string, any> | undefined;
}>;
export type CreatePartnerInput = z.infer<typeof createPartnerSchema>;
