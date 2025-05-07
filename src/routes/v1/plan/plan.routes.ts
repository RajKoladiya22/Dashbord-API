// src/routes/plan.routes.ts
import { authenticateUser, authorizeRoles } from "../../../core/middleware/jwt/jwt.token";
import { Router } from "express";
import { createPlan } from "../../../controllers/plan/plan.controller";

const router = Router();

router.post("/", authenticateUser,  authorizeRoles("super_admin"),  createPlan);

export default router;
