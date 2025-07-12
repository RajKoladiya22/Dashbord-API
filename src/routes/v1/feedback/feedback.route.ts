import {
  authenticateUser,
  authorizeRoles,
} from "../../../core/middleware/jwt/jwt.token";
import { Router } from "express";
import {
  addFeedback,
  listFeedbacks,
} from "../../../controllers/feedback/feedback.controller";

const router = Router();

router.post(
  "/",
  authenticateUser,
  authorizeRoles("admin", "partner", "team_member", "sub_admin"),
  addFeedback
);
router.get("/", authenticateUser, authorizeRoles("super_admin"), listFeedbacks);

export default router;
