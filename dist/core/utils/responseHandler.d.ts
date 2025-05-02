import { Response } from "express";
export declare const sendSuccessResponse: (res: Response, status: number, message: string, data?: any) => Response<any, Record<string, any>>;
export declare const sendErrorResponse: (res: Response, status: number, message: string, errors?: any) => Response<any, Record<string, any>>;
