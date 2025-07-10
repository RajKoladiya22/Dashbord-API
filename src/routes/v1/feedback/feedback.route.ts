import { authenticateUser, authorizeRoles } from "../../../core/middleware/jwt/jwt.token";
import { Router } from "express";
import { addFeedback } from "../../../controllers/feedback/feedback.controller";

const router = Router();

router.post("/", authenticateUser,authorizeRoles("admin", "partner", "team_member", "sub_admin"), addFeedback);

export default router;
