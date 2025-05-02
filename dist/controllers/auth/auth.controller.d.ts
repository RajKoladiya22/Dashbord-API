import { Request, Response, NextFunction } from "express";
import { signInSchema, signUpSchema } from "../../core/utils/zod";
import { z } from "zod";
export declare const signIn: (req: Request<{}, {}, z.infer<typeof signInSchema>>, res: Response, next: NextFunction) => Promise<void>;
export declare const signUp: (req: Request<{}, {}, z.infer<typeof signUpSchema>>, res: Response, next: NextFunction) => Promise<void>;
