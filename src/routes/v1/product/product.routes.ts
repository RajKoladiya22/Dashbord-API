//routes/v1/teamMemberRoutes/teamMember.routes.ts
import { Router } from "express";
import { createProduct, listProducts, updateProduct, deleteProduct, changeProductStatus } from "../../../controllers/product/product.controller";
import {
  authenticateUser,
  authorizeRoles,
} from "../../../core/middleware/jwt/jwt.token";

const router = Router();

router.get('/', authenticateUser,  authorizeRoles("admin"),  listProducts);
router.post('/', authenticateUser,  authorizeRoles("admin"),  createProduct);
router.put('/:id', authenticateUser,  authorizeRoles("admin"),  updateProduct);
router.delete('/:id', authenticateUser,  authorizeRoles("admin"),  deleteProduct);
router.patch('/status/:id', authenticateUser,  authorizeRoles("admin"),  changeProductStatus);

export default router