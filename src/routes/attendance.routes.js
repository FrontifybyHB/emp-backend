import express from "express";
import { clockInController, clockOutController, summaryController, allEmployeesSummaryController } from "../controllers/attendance.controller.js";
import { apiLimiter} from "../middlewares/ratelimit.middleware.js";
import { requireAuth, permit, requireAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/clock-in", 
    requireAuth,
    permit('employee'),
    apiLimiter,
    clockInController
);

router.post("/clock-out", 
    requireAuth,
    permit('employee'),
    apiLimiter,
    clockOutController
);

router.get("/summary", 
    requireAuth,
    permit('employee'),
    apiLimiter,
    summaryController
);

router.get("/all-employees-summary", 
    requireAuth,
    requireAdmin,
    apiLimiter,
    allEmployeesSummaryController
);

export default router;
