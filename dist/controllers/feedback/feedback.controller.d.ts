import { FeedbackSchema_ } from "../../core/utils/zod";
import { Request, Response, NextFunction } from "express";
export declare const addFeedback: (req: Request<{}, {}, FeedbackSchema_>, res: Response, next: NextFunction) => Promise<void>;
export declare const listFeedbacks: (req: Request, res: Response, next: NextFunction) => Promise<void>;
