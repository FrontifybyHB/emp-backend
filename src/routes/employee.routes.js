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

router.post('/', 
    apiLimiter, 
    requireAuth,
    permit('admin', 'hr'), 
    createEmployeeValidator,
    createEmployeeController
);

router.get('/', 
    apiLimiter, 
    requireAuth,
    permit('admin', 'hr', 'manager'), 
    getEmployeesController
);

router.get('/:id', 
    apiLimiter, 
    requireAuth,
    permit('admin', 'hr', 'manager', 'employee'), 
    getEmployeeByIdController
);

router.put('/:id', 
    apiLimiter, 
    requireAuth,
    permit('admin', 'hr'), 
    updateEmployeeValidator,
    updateEmployeeController
);

router.delete('/:id', 
    apiLimiter, 
    requireAuth,
    requireAdmin,
    permit('admin'), 
    deleteEmployeeController
);




export default router;