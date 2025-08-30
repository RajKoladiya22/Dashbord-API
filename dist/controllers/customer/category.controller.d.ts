import { Request, Response, NextFunction } from "express";
export declare const createCustomerCategory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const listCustomerCategories: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateCustomerCategory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteCustomerCategory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const addSpecialization: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateSpecialization: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteSpecialization: (req: Request, res: Response, next: NextFunction) => Promise<void>;
