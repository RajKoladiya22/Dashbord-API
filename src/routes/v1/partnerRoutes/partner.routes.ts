//routes/v1/teamMemberRoutes/teamMember.routes.ts
import { Router } from "express";
import {
  listPartners,
  updatePartnerStatus,
} from "../../../controllers/partner/partner.controller";
import {
  authenticateUser,
  authorizeRoles,
} from "../../../core/middleware/jwt/jwt.token";

const router = Router();

router.get(
  "/", 
  authenticateUser, 
  authorizeRoles("admin"), 
  listPartners
);
router.patch(
  "/:id/status",
  authenticateUser,
  authorizeRoles("admin"),
  updatePartnerStatus
);

export default router;
