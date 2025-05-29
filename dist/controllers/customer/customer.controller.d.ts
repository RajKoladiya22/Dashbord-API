import { Request, Response, NextFunction } from "express";
import { UpdateCustomerBody } from "../../core/utils/zod";
export declare const createCustomer: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const listCustomers: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateCustomer: (req: Request<{
    id: string;
}, {}, UpdateCustomerBody>, res: Response, next: NextFunction) => Promise<void>;
export declare const setCustomerStatus: (req: Request<{
    id: string;
}, {}, {
    status: boolean;
}>, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteCustomer: (req: Request<{
    id: string;
}>, res: Response, next: NextFunction) => Promise<void>;
export declare const editCustomerProduct: (req: Request<{
    customerId: string;
    ProductId: string;
}, {}>, res: Response, next: NextFunction) => Promise<void>;
