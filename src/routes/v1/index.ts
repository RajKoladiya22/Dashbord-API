//routes/v1/index.ts
import { Router } from 'express';
import AuthRoutes from './auth/auth.routes'
import partnerRoutes from './partnerRoutes/partner.routes'
import teamMemberRoutes from './teamMemberRoutes/teamMember.routes';
import productRoutes from './product/product.routes'
import customerRoutes from './customer/customer.routes'
import planRoutes from './plan/plan.routes'
import { sendSuccessResponse } from '../../core/utils/httpResponse';


const router = Router();                                
router.use('/auth', AuthRoutes);                                
router.use('/partner', partnerRoutes);                                
router.use('/team-members', teamMemberRoutes);                                
router.use('/product', productRoutes);                                
router.use('/customer', customerRoutes);                                
router.use('/plan', planRoutes);                                


export default router;