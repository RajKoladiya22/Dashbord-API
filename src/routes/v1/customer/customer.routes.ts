
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
  deleteCustomer,
  listCustomers,
  setCustomerStatus,
  updateCustomer,
  editCustomerProduct,
} from "../../../controllers/customer/customer.controller";
import { getCustomerProductsByCustomerId } from "../../../controllers/customer/customerProduct.controller";
import {
  listRenewalReminders,
  updateCustomerProduct,
} from "../../../controllers/customer/reminder.controller";
// import { bulkCreateCustomers } from "./controllers/customer/customer.bulk.controller";
import { bulkCreateCustomers } from "../../../controllers/customer/customer.bulk.controller";
import { upload } from "../../../core/middleware/multer/fileUpload";

const router = Router();

//  ── CUSTOM FIELD ───────────────────────────────────────────────────────────────
router.get(
  "/customfield",
  authenticateUser,
  authorizeRoles("admin", "partner", "team_member", "sub_admin"),
  listAdminCustomFields
);
router.post(
  "/customfield",
  authenticateUser,
  authorizeRoles("admin", "sub_admin"),
  createAdminCustomField
);
router.put(
  "/customfield/:id",
  authenticateUser,
  authorizeRoles("admin", "sub_admin"),
  updateAdminCustomField
);
router.delete(
  "/customfield/:id",
  authenticateUser,
  authorizeRoles("admin", "sub_admin"),
  deleteAdminCustomField
);

//  ── CUSTOMER ───────────────────────────────────────────────────────────────

router.get(
  "/list",
  authenticateUser,
  authorizeRoles("admin", "partner", "team_member", "sub_admin"),
  listCustomers
);
router.post(
  "/add",
  authenticateUser,
  authorizeRoles("admin", "partner", "sub_admin"),
  createCustomer
);
router.patch(
  "/update/:id",
  authenticateUser,
  authorizeRoles("admin", "partner", "sub_admin"),
  updateCustomer
);
router.patch(
  "/status/:id",
  authenticateUser,
  authorizeRoles("admin", "partner", "team_member", "sub_admin"),
  setCustomerStatus
);
router.patch(
  "/product/update/:customerId/:ProductId",
  authenticateUser,
  authorizeRoles("admin", "partner", "team_member", "sub_admin"),
  editCustomerProduct
);
router.delete(
  "/delete/:id",
  authenticateUser,
  authorizeRoles("admin", "partner", "sub_admin"),
  deleteCustomer
);

//  ── CUSTOMER PRODUCT ───────────────────────────────────────────────────────────────

router.get(
  "/product/:customerId",
  authenticateUser,
  authorizeRoles("admin", "partner", "team_member", "sub_admin"),
  getCustomerProductsByCustomerId
);

router.patch(
  "/product/update/:id",
  authenticateUser,
  authorizeRoles("admin", "partner", "team_member", "sub_admin"),
  updateCustomerProduct
);

//  ── REMINDER PRODUCT ───────────────────────────────────────────────────────────────

router.get(
  "/reminders",
  authenticateUser,
  authorizeRoles("admin", "partner", "team_member", "sub_admin"),
  listRenewalReminders
);
//  ── BULK UPLOAD ───────────────────────────────────────────────────────────────

router.post(
  "/bulk",
  upload.single("file"), 
  authenticateUser,
  authorizeRoles("admin", "partner", "team_member", "sub_admin"),
  bulkCreateCustomers
);


export default router;
