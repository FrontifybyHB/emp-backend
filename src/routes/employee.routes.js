import express from 'express';
import {
    createEmployeeController,
    getEmployeesController,
    getEmployeeByIdController,
    getMyProfileController,
    updateEmployeeController,
    deleteEmployeeController,
    getEmployeesByDepartmentController
} from '../controllers/employee.controller.js';
import { createEmployeeValidator, updateEmployeeValidator } from '../middlewares/validator.middleaware.js';
import { apiLimiter } from '../middlewares/ratelimit.middleware.js';
import { requireAuth, permit, requireAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Create employee (Admin/HR only)
router.post('/',
    apiLimiter,
    requireAuth,
    permit('admin', 'hr'),
    createEmployeeValidator,
    createEmployeeController
);

// Get all employees (Admin/HR/Manager)
router.get('/',
    apiLimiter,
    requireAuth,
    permit('admin', 'hr', 'manager'),
    getEmployeesController
);

// Get my profile (Employee can see their own profile)
router.get('/me',
    apiLimiter,
    requireAuth,
    getMyProfileController
);

// Get employees by department (Admin/HR/Manager)
router.get('/department/:department',
    apiLimiter,
    requireAuth,
    permit('admin', 'hr', 'manager'),
    getEmployeesByDepartmentController
);

// Get employee by ID (Admin/HR/Manager/Employee for own profile)
router.get('/:id',
    apiLimiter,
    requireAuth,
    permit('admin', 'hr', 'manager', 'employee'),
    getEmployeeByIdController
);

// Update employee (Admin/HR only)
router.put('/:id',
    apiLimiter,
    requireAuth,
    permit('admin', 'hr'),
    updateEmployeeValidator,
    updateEmployeeController
);

// Delete employee (Admin only)
router.delete('/:id',
    apiLimiter,
    requireAuth,
    requireAdmin,
    deleteEmployeeController
);

export default router;