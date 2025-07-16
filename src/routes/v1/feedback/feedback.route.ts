import {
  authenticateUser,
  authorizeRoles,
} from "../../../core/middleware/jwt/jwt.token";
import { Router } from "express";
<<<<<<< HEAD
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
=======
import { addFeedback, listFeedbacks } from "../../../controllers/feedback/feedback.controller";

const router = Router();

router.post("/", authenticateUser,authorizeRoles("admin", "partner", "team_member", "sub_admin"), addFeedback);
router.get("/", authenticateUser,authorizeRoles("super_admin"), listFeedbacks);
>>>>>>> 615b86a (Error solve in Bulk Customer Controller)

export default router;
