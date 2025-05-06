import { Request, Response, NextFunction } from "express";
export declare const createCustomer: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const listCustomers: (req: Request, res: Response, next: NextFunction) => Promise<void>;
