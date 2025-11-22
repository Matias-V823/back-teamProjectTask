import { Router } from "express";
import { AIController } from "../controllers/AIController";
import { authenticate } from "../middleware/auth";

const router = Router()

router.post('/generate-project-plan',
    authenticate,
    AIController.generateProjectPlan
)

export default router
