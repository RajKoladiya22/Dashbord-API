import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { signInSchema, signUpSchema, signUpSuperAdminSchema } from "../../core/utils/zod";
export declare const signUpAdmin: (req: Request<{}, {}, z.infer<typeof signUpSchema>>, res: Response, next: NextFunction) => Promise<void>;
export declare const signUpSuperAdmin: (req: Request<{}, {}, z.infer<typeof signUpSuperAdminSchema>>, res: Response, next: NextFunction) => Promise<void>;
export declare const signIn: (req: Request<{}, {}, z.infer<typeof signInSchema>>, res: Response, next: NextFunction) => Promise<void>;
