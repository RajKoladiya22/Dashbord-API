import { Request, Response, NextFunction } from "express";
import { z } from "zod";
declare const createPlanSchema: z.ZodObject<{
    name: z.ZodString;
    duration: z.ZodString;
    price: z.ZodNumber;
    offers: z.ZodOptional<z.ZodArray<z.ZodObject<{
        offerType: z.ZodEnum<["percentage", "fixed", "free_trial"]>;
        value: z.ZodOptional<z.ZodNumber>;
        startsAt: z.ZodOptional<z.ZodString>;
        endsAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        offerType: "percentage" | "fixed" | "free_trial";
        value?: number | undefined;
        startsAt?: string | undefined;
        endsAt?: string | undefined;
    }, {
        offerType: "percentage" | "fixed" | "free_trial";
        value?: number | undefined;
        startsAt?: string | undefined;
        endsAt?: string | undefined;
    }>, "many">>;
    specs: z.ZodOptional<z.ZodArray<z.ZodObject<{
        specName: z.ZodString;
        specValue: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        specName: string;
        specValue: string;
    }, {
        specName: string;
        specValue: string;
    }>, "many">>;
    descriptions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        content: string;
    }, {
        content: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    duration: string;
    price: number;
    offers?: {
        offerType: "percentage" | "fixed" | "free_trial";
        value?: number | undefined;
        startsAt?: string | undefined;
        endsAt?: string | undefined;
    }[] | undefined;
    specs?: {
        specName: string;
        specValue: string;
    }[] | undefined;
    descriptions?: {
        content: string;
    }[] | undefined;
}, {
    name: string;
    duration: string;
    price: number;
    offers?: {
        offerType: "percentage" | "fixed" | "free_trial";
        value?: number | undefined;
        startsAt?: string | undefined;
        endsAt?: string | undefined;
    }[] | undefined;
    specs?: {
        specName: string;
        specValue: string;
    }[] | undefined;
    descriptions?: {
        content: string;
    }[] | undefined;
}>;
type CreatePlanBody = z.infer<typeof createPlanSchema>;
export declare const createPlan: (req: Request<{}, {}, CreatePlanBody>, res: Response, next: NextFunction) => Promise<void>;
export {};
