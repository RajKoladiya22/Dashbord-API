//routes/v1/teamMemberRoutes/teamMember.routes.ts
import { Router } from "express";
import { createTeamMember } from "../../../controllers/team-members/team-members.controller";

const router = Router();

router.post('/',  createTeamMember);

export default router