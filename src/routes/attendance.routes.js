import express from "express";
import { 
    clockInController, 
    clockOutController, 
    summaryController, 
    allEmployeesSummaryController,
    todayAttendanceController,
    employeeAttendanceController
} from "../controllers/attendance.controller.js";
import { apiLimiter } from "../middlewares/ratelimit.middleware.js";
import { requireAuth, permit, requireAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Employee clock in
router.post("/clock-in", 
    requireAuth,
    permit('employee'),
    apiLimiter,
    clockInController
);

// Employee clock out
router.post("/clock-out", 
    requireAuth,
    permit('employee'),
    apiLimiter,
    clockOutController
);

// Get today's attendance status
router.get("/today", 
    requireAuth,
    permit('employee'),
    apiLimiter,
    todayAttendanceController
);

// Get personal attendance summary
router.get("/summary", 
    requireAuth,
    permit('employee'),
    apiLimiter,
    summaryController
);


// Get all employees attendance summary (Admin/HR/Manager)
router.get("/all-employees-summary", 
    requireAuth,
    permit('admin', 'hr', 'manager'),
    apiLimiter,
    allEmployeesSummaryController
);

// Get specific employee attendance (Admin/HR/Manager)
router.get("/employee/:employeeId", 
    requireAuth,
    permit('admin', 'hr', 'manager'),
    apiLimiter,
    employeeAttendanceController
);

export default router;