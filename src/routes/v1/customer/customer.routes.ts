//routes/v1/teamMemberRoutes/teamMember.routes.ts
import { Router } from "express";
import { listAdminCustomFields, createAdminCustomField, updateAdminCustomField, deleteAdminCustomField } from "../../../controllers/customer/custommField.controller";
import {
  authenticateUser,
  authorizeRoles,
} from "../../../core/middleware/jwt/jwt.token";
import { createCustomer, listCustomers } from "../../..//controllers/customer/customer.controller";

const router = Router();

router.get('/customfield', authenticateUser,  authorizeRoles("admin", "partner", "team_member"),  listAdminCustomFields);
router.post('/customfield', authenticateUser,  authorizeRoles("admin"),  createAdminCustomField);
router.put('/customfield/:id', authenticateUser,  authorizeRoles("admin"),  updateAdminCustomField);
router.delete('/customfield/:id', authenticateUser,  authorizeRoles("admin"),  deleteAdminCustomField);

router.get('/list', authenticateUser,  authorizeRoles("admin", "partner", "team_member"),  listCustomers);
router.post('/add', authenticateUser,  authorizeRoles("admin", "partner"),  createCustomer);


export default router