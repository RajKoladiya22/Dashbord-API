import { Request, Response, NextFunction } from "express";
export declare const sendMessageToUser: (toUserId: string, message: any) => void;
export declare const chat_user: (req: Request<{
    id: string;
}, {}, {}>, res: Response, next: NextFunction) => Promise<void>;
export declare const storedMSG: (req: Request, res: Response) => Promise<void>;
