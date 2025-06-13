import { Request, Response, NextFunction } from "express";
export declare const forgotPassword: (req: Request<{}, {}, {
    email: string;
}>, res: Response, next: NextFunction) => Promise<void>;
