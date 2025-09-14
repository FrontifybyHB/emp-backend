import { Router } from "express";
import { 
    setGoalsController, 
    updateGoalStatusController
} from "../controllers/performance.controller.js";
import { apiLimiter } from "../middlewares/ratelimit.middleware.js";
import { requireAuth, permit } from "../middlewares/auth.middleware.js";

const router = Router();

// Goals Management Routes
router.post("/goals", 
    apiLimiter, 
    requireAuth,
    permit('admin', 'hr', 'manager'),
    setGoalsController
);

router.put("/goal/status/:employeeId/:goalId", 
    apiLimiter, 
    requireAuth,
    permit('admin', 'hr', 'manager', 'employee'),
    updateGoalStatusController
);

export default router;