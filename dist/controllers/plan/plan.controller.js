"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPlan = void 0;
const zod_1 = require("zod");
const database_config_1 = require("../../config/database.config");
const responseHandler_1 = require("../../core/utils/responseHandler");
const createPlanSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Plan name is required"),
    duration: zod_1.z.string().min(1, "Duration is required"),
    price: zod_1.z.number().nonnegative("Price must be ≥ 0"),
    offers: zod_1.z
        .array(zod_1.z.object({
        offerType: zod_1.z.enum(["percentage", "fixed", "free_trial"]),
        value: zod_1.z.number().optional(),
        startsAt: zod_1.z.string().optional(),
        endsAt: zod_1.z.string().optional(),
    }))
        .optional(),
    specs: zod_1.z
        .array(zod_1.z.object({
        specName: zod_1.z.string().min(1),
        specValue: zod_1.z.string().min(1),
    }))
        .optional(),
    descriptions: zod_1.z
        .array(zod_1.z.object({
        content: zod_1.z.string().min(1),
    }))
        .optional(),
});
const createPlan = async (req, res, next) => {
    const parsed = createPlanSchema.safeParse(req.body);
    if (!parsed.success) {
        (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid input", {
            errors: parsed.error.errors,
        });
        return;
    }
    const { name, duration, price, offers = [], specs = [], descriptions = [], } = parsed.data;
    try {
        const plan = await database_config_1.prisma.$transaction(async (tx) => {
            return tx.plan.create({
                data: {
                    name,
                    duration,
                    price,
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
        (0, responseHandler_1.sendSuccessResponse)(res, 201, "Plan created", { plan });
        return;
    }
    catch (err) {
        console.error("createPlan error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
        return;
    }
};
exports.createPlan = createPlan;
//# sourceMappingURL=plan.controller.js.map