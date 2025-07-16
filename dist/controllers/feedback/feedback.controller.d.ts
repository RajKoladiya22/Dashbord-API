import { AddFeedbackSchema_ } from "../../core/utils/zod";
import { Request, Response, NextFunction } from "express";
<<<<<<< HEAD
export declare const addFeedback: (req: Request<{}, {}, FeedbackSchema_>, res: Response, next: NextFunction) => Promise<void>;
=======
export declare const addFeedback: (req: Request<{}, {}, AddFeedbackSchema_>, res: Response, next: NextFunction) => Promise<void>;
>>>>>>> 615b86a (Error solve in Bulk Customer Controller)
export declare const listFeedbacks: (req: Request, res: Response, next: NextFunction) => Promise<void>;
