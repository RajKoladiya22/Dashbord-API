//routes/v1/teamMemberRoutes/teamMember.routes.ts
import { Router } from "express";
import { listTeamMembers, updateTeamMemberStatus } from "../../../controllers/team-members/team-members.controller";
import {
  authenticateUser,
  authorizeRoles,
} from "../../../core/middleware/jwt/jwt.token";

const router = Router();

router.get("/", authenticateUser, authorizeRoles("admin", "sub_admin"), listTeamMembers);
router.patch(
  "/:id/status",
  authenticateUser,
  authorizeRoles("admin"),
  updateTeamMemberStatus
);

export default router;
