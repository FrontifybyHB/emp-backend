// routes/leave.routes.js
import express from "express";
import { 
    requestLeaveController, 
    approveLeaveController, 
    getAllLeavesController 
} from "../controllers/leave.controller.js";
import { apiLimiter } from "../middlewares/ratelimit.middleware.js";
import { requireAuth, permit } from "../middlewares/auth.middleware.js";
import { 
    requestLeaveValidator, 
    approveLeaveValidator } from "../middlewares/validator.middleaware.js";

const router = express.Router();

router.post("/request",
    apiLimiter,
    requestLeaveValidator,
    requireAuth,
    permit('employee'),
    requestLeaveController
);

router.put("/approve/:id",
    apiLimiter,
    approveLeaveValidator,
    requireAuth,
    permit('admin', 'hr', 'manager'),
    approveLeaveController
);

router.get("/get-all-leaves",
    apiLimiter,
    requireAuth,
    permit('admin', 'hr', 'manager'),
    getAllLeavesController
);

export default router;
