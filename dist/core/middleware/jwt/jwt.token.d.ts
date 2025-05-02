import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../utils/interface";
export declare const authenticateUser: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const authorizeRoles: (...allowedRoles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const generateToken: (userId: string, role: string, adminId?: string) => string;
export declare const setAuthCookie: (res: Response, token: string) => void;
