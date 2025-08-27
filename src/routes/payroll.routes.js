import express from "express";
import { 
    runPayrollCycleController, 
    getAllPayrollsController,
    getMyPayrollsController,
    getPayrollByIdController,
    updatePayrollController,
    deletePayrollController,
    calculateSalaryController,
    getPayslipController
} from "../controllers/payroll.controller.js";
import { apiLimiter } from "../middlewares/ratelimit.middleware.js";
import { requireAuth, permit } from "../middlewares/auth.middleware.js";
import { 
    runPayrollValidator, 
    updatePayrollValidator 
} from "../middlewares/validator.middleaware.js";

const router = express.Router();

// Run payroll cycle (Admin/HR only)
router.post("/run-cycle", 
    apiLimiter, 
    requireAuth,
    permit('admin', 'hr'),
    runPayrollValidator,
    runPayrollCycleController
);

// Get all payroll records (Admin/HR/Manager)
router.get("/all",
    apiLimiter,
    requireAuth,
    permit('admin', 'hr', 'manager'),
    getAllPayrollsController
);

// Get my payroll records (Employee)
router.get("/my-payrolls",
    apiLimiter,
    requireAuth,
    permit('employee'),
    getMyPayrollsController
);

// Get specific payroll record (Admin/HR/Manager/Employee for own)
router.get("/:payrollId",
    apiLimiter,
    requireAuth,
    permit('admin', 'hr', 'manager', 'employee'),
    getPayrollByIdController
);

// Update payroll record (Admin/HR only)
router.put("/:payrollId",
    apiLimiter,
    requireAuth,
    permit('admin', 'hr'),
    updatePayrollValidator,
    updatePayrollController
);

// Delete payroll record (Admin only)
router.delete("/:payrollId",
    apiLimiter,
    requireAuth,
    permit('admin'),
    deletePayrollController
);


// Legacy routes for backward compatibility
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