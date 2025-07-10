import { Request, Response, NextFunction } from "express";
export declare const forgotPassword: (req: Request<{}, {}, {
    email: string;
}>, res: Response, next: NextFunction) => Promise<void>;
export declare const UpdatePassword: (req: Request<{}, {}, {
    email: string;
    otp: string;
    newPassword: string;
}>, res: Response, next: NextFunction) => Promise<void>;
