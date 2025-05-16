"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePlan = exports.deletePlan = exports.setPlanStatus = exports.listPlans = exports.createPlan = void 0;
const database_config_1 = require("../../config/database.config");
const responseHandler_1 = require("../../core/utils/responseHandler");
const zod_1 = require("../../core/utils/zod");
const createPlan = async (req, res, next) => {
    const user = req.user;
    if (!user || user.role !== "super_admin") {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const parsed = zod_1.createPlanSchema.safeParse(req.body);
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
const listPlans = async (req, res, next) => {
    const parsed = zod_1.listPlansQuery.safeParse(req.query);
    if (!parsed.success) {
        (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid query", {
            errors: parsed.error.errors,
        });
        return;
    }
    const { status, page, limit } = parsed.data;
    const skip = (page - 1) * limit;
    try {
        const [total, plans] = await Promise.all([
            database_config_1.prisma.plan.count({ where: { status } }),
            database_config_1.prisma.plan.findMany({
                where: { status },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
        ]);
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Plans fetched", {
            plans,
            meta: { total, page, limit, pages: Math.ceil(total / limit) },
        });
    }
    catch (err) {
        console.error("listPlans error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
    }
};
exports.listPlans = listPlans;
const setPlanStatus = async (req, res, next) => {
    var _a;
    const { id } = req.params;
    const user = req.user;
    if (!user || user.role !== "super_admin") {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const parsed = zod_1.statusSchema.safeParse(req.body);
    if (!parsed.success || !parsed)
        (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid input", {
            errors: parsed.error.errors,
        });
    try {
        const updated = await database_config_1.prisma.plan.update({
            where: { id },
            data: { status: (_a = parsed.data) === null || _a === void 0 ? void 0 : _a.status },
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Plan status updated", { plan: updated });
    }
    catch (err) {
        if (err.code === "P2025")
            (0, responseHandler_1.sendErrorResponse)(res, 404, "Plan not found");
        console.error("setPlanStatus error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
    }
};
exports.setPlanStatus = setPlanStatus;
const deletePlan = async (req, res, next) => {
    const { id } = req.params;
    const user = req.user;
    if (!user || user.role !== "super_admin") {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    try {
        const deleted = await database_config_1.prisma.plan.delete({ where: { id } });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Plan deleted", { plan: deleted });
    }
    catch (err) {
        if (err.code === "P2025")
            (0, responseHandler_1.sendErrorResponse)(res, 404, "Plan not found");
        console.error("deletePlan error:", err);
        (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
    }
};
exports.deletePlan = deletePlan;
const updatePlan = async (req, res, next) => {
    const user = req.user;
    if (!user || user.role !== "super_admin") {
        (0, responseHandler_1.sendErrorResponse)(res, 401, "Unauthorized");
        return;
    }
    const { id } = req.params;
    const parsed = zod_1.createPlanSchema.safeParse(req.body);
    if (!parsed.success) {
        (0, responseHandler_1.sendErrorResponse)(res, 400, "Invalid input", {
            errors: parsed.error.errors,
        });
        return;
    }
    const { name, duration, price, offers = [], specs = [], descriptions = [], } = parsed.data;
    try {
        const updatedPlan = await database_config_1.prisma.$transaction(async (tx) => {
            const plan = await tx.plan.update({
                where: { id },
                data: {
                    name,
                    duration,
                    price,
                },
            });
            await tx.planOffer.deleteMany({ where: { planId: id } });
            await tx.planSpec.deleteMany({ where: { planId: id } });
            await tx.planDescription.deleteMany({ where: { planId: id } });
            await tx.planOffer.createMany({
                data: offers.map((o) => {
                    var _a;
                    return ({
                        planId: id,
                        offerType: o.offerType,
                        value: (_a = o.value) !== null && _a !== void 0 ? _a : null,
                        startsAt: o.startsAt ? new Date(o.startsAt) : null,
                        endsAt: o.endsAt ? new Date(o.endsAt) : null,
                    });
                }),
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
            return tx.plan.findUnique({
                where: { id },
                include: {
                    offers: true,
                    specs: true,
                    descriptions: true,
                },
            });
        });
        (0, responseHandler_1.sendSuccessResponse)(res, 200, "Plan updated", { plan: updatedPlan });
    }
    catch (err) {
        console.error("updatePlan error:", err);
        if (err.code === "P2025") {
            (0, responseHandler_1.sendErrorResponse)(res, 404, "Plan not found");
        }
        else {
            (0, responseHandler_1.sendErrorResponse)(res, 500, "Server error");
        }
    }
};
exports.updatePlan = updatePlan;
//# sourceMappingURL=plan.controller.js.map