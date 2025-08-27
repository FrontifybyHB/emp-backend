import express from "express";
import { 
    requestLeaveController, 
    approveLeaveController, 
    getAllLeavesController,
    getMyLeavesController,
    getLeaveByIdController,
    cancelLeaveController,
} from "../controllers/leave.controller.js";
import { apiLimiter } from "../middlewares/ratelimit.middleware.js";
import { requireAuth, permit } from "../middlewares/auth.middleware.js";
import { 
    requestLeaveValidator, 
    approveLeaveValidator 
} from "../middlewares/validator.middleaware.js";

const router = express.Router();

// Request leave (Employee only)
router.post("/request",
    apiLimiter,
    requireAuth,
    permit('employee'),
    requestLeaveValidator,
    requestLeaveController
);

// Get my leave requests (Employee only)
router.get("/my-leaves",
    apiLimiter,
    requireAuth,
    permit('employee'),
    getMyLeavesController
);


// Cancel leave request (Employee only)
router.delete("/cancel/:leaveId",
    apiLimiter,
    requireAuth,
    permit('employee'),
    cancelLeaveController
);

// Get all leave requests (Admin/HR/Manager)
router.get("/all",
    apiLimiter,
    requireAuth,
    permit('admin', 'hr', 'manager'),
    getAllLeavesController
);

// Get specific leave request (Admin/HR/Manager/Employee for own)
router.get("/:leaveId",
    apiLimiter,
    requireAuth,
    permit('admin', 'hr', 'manager', 'employee'),
    getLeaveByIdController
);

// Approve/Reject leave (Admin/HR/Manager)
router.put("/approve/:leaveId",
    apiLimiter,
    requireAuth,
    permit('admin', 'hr', 'manager'),
    approveLeaveValidator,
    approveLeaveController
);

export default router;