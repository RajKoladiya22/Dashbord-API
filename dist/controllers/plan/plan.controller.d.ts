import { Request, Response, NextFunction } from "express";
import { CreatePlanBody } from "../../core/utils/zod";
export declare const createPlan: (req: Request<{}, {}, CreatePlanBody>, res: Response, next: NextFunction) => Promise<void>;
export declare const listPlans: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const setPlanStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deletePlan: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updatePlan: (req: Request, res: Response, next: NextFunction) => Promise<void>;
