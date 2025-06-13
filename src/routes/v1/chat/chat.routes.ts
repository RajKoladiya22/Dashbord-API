import { Router } from "express";
const router = Router();
import {
  authenticateUser,
  authorizeRoles,
} from "../../../core/middleware/jwt/jwt.token";

import { chat_user, storedMSG} from "../../../controllers/chat/chat.controller";

router.get(
  "/",
  authenticateUser,
  authorizeRoles("admin", "partner", "team_member"),
  chat_user
);

router.get(
  "/:id",
  authenticateUser,
  authorizeRoles("admin", "partner", "team_member"),
  chat_user
);

router.post(
  "/:id",
  authenticateUser,
  authorizeRoles("admin", "partner", "team_member"),
  storedMSG
);

export default router;


