import { Request, Response, NextFunction } from "express";
export declare const getProfile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateProfile: (req: Request<{}, {}, {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    contactInfo?: any;
    address?: any;
}>, res: Response, next: NextFunction) => Promise<void>;
