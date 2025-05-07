//routes/v1/teamMemberRoutes/teamMember.routes.ts
import { Router } from "express";
import {
  listAdminCustomFields,
  createAdminCustomField,
  updateAdminCustomField,
  deleteAdminCustomField,
} from "../../../controllers/customer/custommField.controller";
import {
  authenticateUser,
  authorizeRoles,
} from "../../../core/middleware/jwt/jwt.token";
import {
  createCustomer,
  listCustomers,
  updateCustomer,
} from "../../../controllers/customer/customer.controller";
import { getCustomerProductsByCustomerId } from "../../../controllers/customer/customerProduct.controller";
import { listRenewalReminders } from "../../../controllers/customer/reminder.controller";

const router = Router();

router.get(
  "/customfield",
  authenticateUser,
  authorizeRoles("admin", "partner", "team_member"),
  listAdminCustomFields
);
router.post(
  "/customfield",
  authenticateUser,
  authorizeRoles("admin"),
  createAdminCustomField
);
router.put(
  "/customfield/:id",
  authenticateUser,
  authorizeRoles("admin"),
  updateAdminCustomField
);
router.delete(
  "/customfield/:id",
  authenticateUser,
  authorizeRoles("admin"),
  deleteAdminCustomField
);

router.get(
  "/list",
  authenticateUser,
  authorizeRoles("admin", "partner", "team_member"),
  listCustomers
);
router.post(
  "/add",
  authenticateUser,
  authorizeRoles("admin", "partner"),
  createCustomer
);
router.put(
  "/update/:id",
  authenticateUser,
  authorizeRoles("admin", "partner"),
  updateCustomer
);

router.get(  "/product/:customerId",  authenticateUser,  authorizeRoles("admin", "partner", "team_member"), getCustomerProductsByCustomerId
);



router.get(  "/reminders/",  authenticateUser,  authorizeRoles("admin", "partner", "team_member"), listRenewalReminders
);

export default router;
