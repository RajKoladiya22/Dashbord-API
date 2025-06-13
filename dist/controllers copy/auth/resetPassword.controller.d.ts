import { Request, Response, NextFunction } from "express";
export declare const resetPassword: (req: Request<{}, {}, {
    oldPassword: string;
    newPassword: string;
}>, res: Response, next: NextFunction) => Promise<void>;
