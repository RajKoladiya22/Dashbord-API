import { Router } from "express";
import { currentPlan } from "../../../controllers/plan/currentPlan.controller";
import {
  authenticateUser,
  authorizeRoles,
} from "../../../core/middleware/jwt/jwt.token";
const router = Router();
router.get(
  "/",
  authenticateUser,
  authorizeRoles("admin"),
  currentPlan
);

export default router;
