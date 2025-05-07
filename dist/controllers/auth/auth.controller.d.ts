import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { signInSchema, signUpSchema } from "../../core/utils/zod";
declare const signUpSuperAdminSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    contactNumber: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    contactNumber?: string | undefined;
    address?: Record<string, any> | undefined;
}, {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    contactNumber?: string | undefined;
    address?: Record<string, any> | undefined;
}>;
export declare const signUpAdmin: (req: Request<{}, {}, z.infer<typeof signUpSchema>>, res: Response, next: NextFunction) => Promise<void>;
export declare const signUpSuperAdmin: (req: Request<{}, {}, z.infer<typeof signUpSuperAdminSchema>>, res: Response, next: NextFunction) => Promise<void>;
export declare const signIn: (req: Request<{}, {}, z.infer<typeof signInSchema>>, res: Response, next: NextFunction) => Promise<void>;
export {};
