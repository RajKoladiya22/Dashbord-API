
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
  deleteCustomerProduct,
} from "../../../controllers/customer/customer.controller";
import { getCustomerProductsByCustomerId } from "../../../controllers/customer/customerProduct.controller";
import {
  listRenewalReminders,
  updateCustomerProduct,
} from "../../../controllers/customer/reminder.controller";
// import { bulkCreateCustomers } from "./controllers/customer/customer.bulk.controller";
import { bulkCreateCustomers, bulkVerifyCustomers } from "../../../controllers/customer/customer.bulk.controller";
import { upload } from "../../../core/middleware/multer/fileUpload";
import { addSpecialization, createCustomerCategory, deleteCustomerCategory, deleteSpecialization, listCustomerCategories, updateCustomerCategory, updateSpecialization } from "../../../controllers/customer/category.controller";

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
  authorizeRoles("admin", "partner", "sub_admin", "team_member"),
  createCustomer
);
router.patch(
  "/update/:id",
  authenticateUser,
  authorizeRoles("admin", "partner", "sub_admin", "team_member"),
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
  "/product/delete/:customerId/:ProductId",
  authenticateUser,
  authorizeRoles("admin", "partner", "team_member", "sub_admin"),
  deleteCustomerProduct
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
  bulkVerifyCustomers
);
router.post(
  "/bulk-upload",
  upload.single("file"),
  authenticateUser,
  authorizeRoles("admin", "partner", "team_member", "sub_admin"),
  bulkCreateCustomers
);

//  ── CATEGORY ───────────────────────────────────────────────────────────────
router.get(
  "/category",
  authenticateUser,
  authorizeRoles("admin", "partner", "team_member", "sub_admin"),
  listCustomerCategories
);
router.post(
  "/category",
  authenticateUser,
  authorizeRoles("admin", "sub_admin"),
  createCustomerCategory
);
router.patch(
  "/category/:id",
  authenticateUser,
  authorizeRoles("admin", "sub_admin"),
  updateCustomerCategory
);
router.delete(
  "/category/:id",
  authenticateUser,
  authorizeRoles("admin", "sub_admin"),
  deleteCustomerCategory
);

//  ── SPECIALIZATION ───────────────────────────────────────────────────────────────
router.patch(
  "/category/:id/addspecialization",
  authenticateUser,
  authorizeRoles("admin", "sub_admin"),
  addSpecialization
);
router.patch(
  "/category/:id/updatespecialization",
  authenticateUser,
  authorizeRoles("admin", "sub_admin"),
  updateSpecialization
);
router.patch(
  "/category/:id/deletespecialization",
  authenticateUser,
  authorizeRoles("admin", "sub_admin"),
  deleteSpecialization
);

export default router;
