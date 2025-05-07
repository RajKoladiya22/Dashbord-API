import { Request, Response, NextFunction } from 'express';
export declare const getCustomerProductsByCustomerId: (req: Request<{
    customerId: string;
}, {}, {}>, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
