import express from 'express';
import {
    createEmployeeController,
    getEmployeesController,
    getEmployeeByIdController,
    updateEmployeeController,
    deleteEmployeeController,
} from '../controllers/employee.controller.js';
import { createEmployeeValidator, updateEmployeeValidator } from '../middlewares/validator.middleaware.js';
import { apiLimiter } from '../middlewares/ratelimit.middleware.js';
import { requireAuth, permit, requireAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Apply authentication to all routes
router.use(requireAuth);


// @desc Create employee
// @route POST /api/employees
router.post('/', 
    apiLimiter, 
    permit('admin', 'hr'), 
    createEmployeeValidator,
    createEmployeeController
);

// @desc Get all employees
// @route GET /api/employees
router.get('/', 
    apiLimiter, 
    permit('admin', 'hr', 'manager'), 
    getEmployeesController
);

// @desc Get employee by ID
// @route GET /api/employees/:id
router.get('/:id', 
    apiLimiter, 
    permit('admin', 'hr', 'manager', 'employee'), 
    getEmployeeByIdController
);

// @desc Update employee
// @route PUT /api/employees/:id
router.put('/:id', 
    apiLimiter, 
    permit('admin', 'hr'), 
    updateEmployeeValidator,
    updateEmployeeController
);

// @desc Delete employee
// @route DELETE /api/employees/:id
router.delete('/:id', 
    apiLimiter, 
    requireAdmin,
    permit('admin'), 
    deleteEmployeeController
);




export default router;