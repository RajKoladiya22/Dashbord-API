//routes/v1/teamMemberRoutes/teamMember.routes.ts
import { Router } from "express";
import {
  signUpSuperAdmin,
  signIn,
  signUpAdmin,
} from "../../../controllers/auth/auth.controller";
import { createPartner } from "../../../controllers/auth/partnerAuth.controller";
import {
  authenticateUser,
  authorizeRoles,
} from "../../../core/middleware/jwt/jwt.token";
import { createTeamMember } from "../../../controllers/auth/teamAuth.controller";
import {
  updateProfile,
  getProfile,
} from "../../../controllers/auth/profile.controller";
import { forgotPassword } from "../../../controllers/auth/forgotPassword.controller";
import { resetPassword } from "../../../controllers/auth/resetPassword.controller";
import { listAllAdmins,subAdminDetails,approveAdmin } from "../../../controllers/auth/superAdmin.controller";
import { updateTeamRole } from "../../../controllers/auth/role.controller";
const router = Router();

router.post("/super-admin/signup", signUpSuperAdmin);

router.post("/signup", signUpAdmin);

router.post("/signin", signIn);

router.patch(
  "/profile",
  authenticateUser,
  authorizeRoles("super_admin", "admin", "partner", "team_member"),
  updateProfile
);
router.get(
  "/profile",
  authenticateUser,
  authorizeRoles("super_admin", "admin", "partner", "team_member"),
  getProfile
);
router.post("/forgot-password", forgotPassword);
router.post(
  "/reset-password",
  authenticateUser,
  authorizeRoles("super_admin", "admin", "partner", "team_member"),
  resetPassword
);

//  ── PARTNER & TEAM ───────────────────────────────────────────────────────────────

router.post(
  "/partner",
  authenticateUser,
  authorizeRoles("admin"),
  createPartner
);
router.post(
  "/team",
  authenticateUser,
  authorizeRoles("admin"),
  createTeamMember
);

router.get(
  "/admins",
  authenticateUser,
  authorizeRoles("super_admin"),
  listAllAdmins
);

router.get(
  "/admins/:id/:query",
  authenticateUser,
  authorizeRoles("super_admin"),
  subAdminDetails
);

router.patch(
  "/role/:id/",
  authenticateUser,
  authorizeRoles("admin"),
  updateTeamRole
);

router.patch(
  "/admins/status/:id",
  authenticateUser,
  authorizeRoles("super_admin"),
  approveAdmin
);
export default router;
