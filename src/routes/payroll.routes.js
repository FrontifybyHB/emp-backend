import express from "express";
import { 
    runPayrollCycleController, 
    calculateSalaryController, 
    getPayslipController 
} from "../controllers/payroll.controller.js";
import { apiLimiter } from "../middlewares/ratelimit.middleware.js";
import { requireAuth, permit } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/run-cycle", 
    apiLimiter, 
    requireAuth,
    permit('admin', 'hr'),
    runPayrollCycleController
);

router.get("/calculate/:id", 
    apiLimiter, 
    requireAuth,
    permit('admin', 'hr', 'manager', 'employee'),
    calculateSalaryController
);

router.get("/payslip/:id", 
    apiLimiter, 
    requireAuth,
    permit('admin', 'hr', 'manager', 'employee'),
    getPayslipController
);

export default router;
