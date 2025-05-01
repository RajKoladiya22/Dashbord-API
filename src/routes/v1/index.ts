//routes/v1/index.ts
import { Router } from 'express';
import teamMemberRoutes from './teamMemberRoutes/teamMember.routes';
import AuthRoutes from './auth/auth.routes'


const router = Router();
router.use('/team-members', teamMemberRoutes);                                
router.use('/auth', AuthRoutes);                                


export default router;