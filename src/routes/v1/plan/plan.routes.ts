// src/routes/plan.routes.ts
import { authenticateUser, authorizeRoles } from "../../../core/middleware/jwt/jwt.token";
import { Router } from "express";
import { createPlan, listPlans, setPlanStatus, deletePlan, updatePlan } from "../../../controllers/plan/plan.controller";

const router = Router();

router.post("/", authenticateUser,  authorizeRoles("super_admin"),  createPlan);
router.get("/", listPlans);
router.patch("/status/:id", authenticateUser,  authorizeRoles("super_admin"),  setPlanStatus);
router.put("/:id", authenticateUser,  authorizeRoles("super_admin"),  updatePlan);
router.delete("/:id", authenticateUser,  authorizeRoles("super_admin"),  deletePlan);

export default router;
