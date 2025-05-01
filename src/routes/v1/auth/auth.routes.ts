//routes/v1/teamMemberRoutes/teamMember.routes.ts
import { Router } from "express";
import { signIn, signUp } from "../../../controllers/auth/auth.controller";
import { createPartner } from "../../../controllers/auth/partnerAuth.controller";
import {
  authenticateUser,
  authorizeRoles,
} from "../../../core/middleware/jwt/jwt.token";
import { createTeamMember } from "../../../controllers/auth/teamAuth.controller";

const router = Router();

router.post("/signin", signIn);
router.post("/signup", signUp);
router.post("/partner",  authenticateUser,  authorizeRoles("admin"),  createPartner);
router.post("/team",  authenticateUser,  authorizeRoles("admin"),  createTeamMember);

export default router;
