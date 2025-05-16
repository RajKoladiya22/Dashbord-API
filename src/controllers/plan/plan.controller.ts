// src/controllers/plan/plan.controller.ts

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../config/database.config";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../core/utils/responseHandler";
import {
  CreatePlanBody,
  listPlansQuery,
  ListPlansQuery_,
  statusSchema,
  createPlanSchema,
} from "../../core/utils/zod";

export const createPlan = async (
  req: Request<{}, {}, CreatePlanBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user;
  if (!user || user.role !== "super_admin") {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }

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

export const listPlans = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const parsed = listPlansQuery.safeParse(req.query);
  if (!parsed.success) {
    sendErrorResponse(res, 400, "Invalid query", {
      errors: parsed.error.errors,
    });
    return;
  }

  const { status, page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  try {
    const [total, plans] = await Promise.all([
      prisma.plan.count({ where: { status } }), // count with status filter
      prisma.plan.findMany({
        where: { status },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    sendSuccessResponse(res, 200, "Plans fetched", {
      plans,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    console.error("listPlans error:", err);
    sendErrorResponse(res, 500, "Server error");
  }
};

export const setPlanStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  const user = req.user;

  if (!user || user.role !== "super_admin") {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success || !parsed)
    sendErrorResponse(res, 400, "Invalid input", {
      errors: parsed.error.errors,
    });

  try {
    const updated = await prisma.plan.update({
      where: { id },
      data: { status: parsed.data?.status },
    });
    sendSuccessResponse(res, 200, "Plan status updated", { plan: updated });
  } catch (err: any) {
    // Handle not‑found (P2025) and FK errors (none here) 
    if (err.code === "P2025") sendErrorResponse(res, 404, "Plan not found");
    console.error("setPlanStatus error:", err);
    sendErrorResponse(res, 500, "Server error");
  }
};

export const deletePlan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;
  const user = req.user;
  if (!user || user.role !== "super_admin") {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }
  try {
    const deleted = await prisma.plan.delete({ where: { id } });
    sendSuccessResponse(res, 200, "Plan deleted", { plan: deleted });
  } catch (err: any) {
    if (err.code === "P2025") sendErrorResponse(res, 404, "Plan not found");
    console.error("deletePlan error:", err);
    sendErrorResponse(res, 500, "Server error");
  }
};

export const updatePlan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user;
  if (!user || user.role !== "super_admin") {
    sendErrorResponse(res, 401, "Unauthorized");
    return;
  }

  const { id } = req.params;

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
    const updatedPlan = await prisma.$transaction(async (tx) => {
      // Update the main plan details
      const plan = await tx.plan.update({
        where: { id },
        data: {
          name,
          duration,
          price,
        },
      });

      // Delete existing related entries
      await tx.planOffer.deleteMany({ where: { planId: id } });
      await tx.planSpec.deleteMany({ where: { planId: id } });
      await tx.planDescription.deleteMany({ where: { planId: id } });

      // Create new related entries
      await tx.planOffer.createMany({
        data: offers.map((o) => ({
          planId: id,
          offerType: o.offerType,
          value: o.value ?? null,
          startsAt: o.startsAt ? new Date(o.startsAt) : null,
          endsAt: o.endsAt ? new Date(o.endsAt) : null,
        })),
      });

      await tx.planSpec.createMany({
        data: specs.map((s) => ({
          planId: id,
          specName: s.specName,
          specValue: s.specValue,
        })),
      });

      await tx.planDescription.createMany({
        data: descriptions.map((d) => ({
          planId: id,
          content: d.content,
        })),
      });

      // Fetch the updated plan with related entries
      return tx.plan.findUnique({
        where: { id },
        include: {
          offers: true,
          specs: true,
          descriptions: true,
        },
      });
    });

    sendSuccessResponse(res, 200, "Plan updated", { plan: updatedPlan });
  } catch (err: any) {
    console.error("updatePlan error:", err);
    if (err.code === "P2025") {
      sendErrorResponse(res, 404, "Plan not found");
    } else {
      sendErrorResponse(res, 500, "Server error");
    }
  }
};
