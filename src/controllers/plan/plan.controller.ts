// src/controllers/plan.controller.ts

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../config/database.config";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../core/utils/responseHandler";

// 1) Zod schema for input validation
const createPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  duration: z.string().min(1, "Duration is required"),
  price: z.number().nonnegative("Price must be ≥ 0"),
  offers: z
    .array(
      z.object({
        offerType: z.enum(["percentage", "fixed", "free_trial"]),
        value: z.number().optional(),
        startsAt: z.string().optional(),
        endsAt: z.string().optional(),
      })
    )
    .optional(),
  specs: z
    .array(
      z.object({
        specName: z.string().min(1),
        specValue: z.string().min(1),
      })
    )
    .optional(),
  descriptions: z
    .array(
      z.object({
        content: z.string().min(1),
      })
    )
    .optional(),
});
type CreatePlanBody = z.infer<typeof createPlanSchema>;

// 2) Controller
export const createPlan = async (
  req: Request<{}, {}, CreatePlanBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Validate request body
  const parsed = createPlanSchema.safeParse(req.body);
  if (!parsed.success) {
    sendErrorResponse(res, 400, "Invalid input", {
      errors: parsed.error.errors,
    });
    return;
  }

  const {
    name,
    duration,
    price,
    offers = [],
    specs = [],
    descriptions = [],
  } = parsed.data;

  try {
    // Wrap in a transaction to ensure all-or-nothing
    const plan = await prisma.$transaction(async (tx) => {
      return tx.plan.create({
        data: {
          name,
          duration,
          price,
          // nested creations
          offers: {
            create: offers.map((o) => ({
              offerType: o.offerType,
              value: o.value,
              startsAt: o.startsAt ? new Date(o.startsAt) : undefined,
              endsAt: o.endsAt ? new Date(o.endsAt) : undefined,
            })),
          },
          specs: {
            create: specs.map((s) => ({
              specName: s.specName,
              specValue: s.specValue,
            })),
          },
          descriptions: {
            create: descriptions.map((d) => ({
              content: d.content,
            })),
          },
        },
        include: {
          offers: true,
          specs: true,
          descriptions: true,
        },
      });
    });

    sendSuccessResponse(res, 201, "Plan created", { plan });
    return;
  } catch (err) {
    console.error("createPlan error:", err);
    sendErrorResponse(res, 500, "Server error");
    return;
  }
};
