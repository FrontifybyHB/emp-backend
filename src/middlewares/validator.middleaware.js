import { query, body, validationResult } from 'express-validator';

export const registerValidator = [
    body('username')
        .notEmpty()
        .withMessage('Username is required')
        .isLength({ min: 3, max: 20 })
        .withMessage('Username must be between 3 and 20 characters'),
    body('email')
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Email is invalid'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];


export const loginValidator = [
    body("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Email is invalid"),

    body("password")
        .notEmpty()
        .withMessage("Password is required"),

    // Final middleware to handle validation result
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation failed",
                errors: errors.array(),
            });
        }
        next();
    },
];


export const createEmployeeValidator = [
    body('user')
        .notEmpty()
        .withMessage('User ID is required')
        .isMongoId()
        .withMessage('Invalid user ID'),
    body('firstName')
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    body('department')
        .notEmpty()
        .withMessage('Department is required'),
    body('role')
        .notEmpty()
        .withMessage('Role is required'),
    body('joiningDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid joining date format'),
    body('salary.base')
        .optional()
        .isNumeric()
        .withMessage('Base salary must be a number'),
    body('salary.allowance')
        .optional()
        .isNumeric()
        .withMessage('Allowance must be a number'),
    body('salary.deductions')
        .optional()
        .isNumeric()
        .withMessage('Deductions must be a number'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation failed",
                errors: errors.array(),
            });
        }
        next();
    }
];

export const updateEmployeeValidator = [
    body('firstName')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    body('department')
        .optional()
        .notEmpty()
        .withMessage('Department cannot be empty'),
    body('role')
        .optional()
        .notEmpty()
        .withMessage('Role cannot be empty'),
    body('joiningDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid joining date format'),
    body('salary.base')
        .optional()
        .isNumeric()
        .withMessage('Base salary must be a number'),
    body('salary.allowance')
        .optional()
        .isNumeric()
        .withMessage('Allowance must be a number'),
    body('salary.deductions')
        .optional()
        .isNumeric()
        .withMessage('Deductions must be a number'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation failed",
                errors: errors.array(),
            });
        }
        next();
    }
];

export const requestLeaveValidator = [
    body('startDate')
        .notEmpty()
        .withMessage('Start date is required')
        .isISO8601()
        .withMessage('Invalid start date format')
        .custom((value) => {
            const startDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (startDate < today) {
                throw new Error('Start date cannot be in the past');
            }
            return true;
        }),
    body('endDate')
        .notEmpty()
        .withMessage('End date is required')
        .isISO8601()
        .withMessage('Invalid end date format')
        .custom((value, { req }) => {
            const startDate = new Date(req.body.startDate);
            const endDate = new Date(value);
            if (endDate < startDate) {
                throw new Error('End date cannot be before start date');
            }
            return true;
        }),
    body('reason')
        .notEmpty()
        .withMessage('Reason is required')
        .isLength({ min: 10, max: 500 })
        .withMessage('Reason must be between 10 and 500 characters'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation failed",
                errors: errors.array(),
            });
        }
        next();
    }
];

export const approveLeaveValidator = [
    body('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(['Approved', 'Rejected'])
        .withMessage('Status must be either Approved or Rejected'),
    body('rejectionReason')
        .optional()
        .custom((value, { req }) => {
            if (req.body.status === 'Rejected' && (!value || value.trim().length === 0)) {
                throw new Error('Rejection reason is required when rejecting leave');
            }
            if (value && value.length > 200) {
                throw new Error('Rejection reason cannot exceed 200 characters');
            }
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Validation failed",
                errors: errors.array(),
            });
        }
        next();
    }
];

export const runPayrollValidator = [
    body('employees')
        .notEmpty()
        .withMessage('Employees array is required')
        .isArray({ min: 1 })
        .withMessage('Employees must be a non-empty array'),
    body('month')
        .notEmpty()
        .withMessage('Month is required')
        .isInt({ min: 1, max: 12 })
        .withMessage('Month must be between 1 and 12'),
    body('year')
        .notEmpty()
        .withMessage('Year is required')
        .isInt({ min: 2020, max: new Date().getFullYear() + 1 })
        .withMessage(`Year must be between 2020 and ${new Date().getFullYear() + 1}`)
        .custom((year, { req }) => {
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth() + 1;
            
            // Prevent running payroll for future months beyond next month
            if (year === currentYear && req.body.month > currentMonth + 1) {
                throw new Error('Cannot run payroll more than 1 month in advance');
            }
            
            // Prevent running payroll for months too far in the past
            if (year < currentYear - 1) {
                throw new Error('Cannot run payroll for years older than last year');
            }
            
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }
        next();
    }
];

export const updatePayrollValidator = [
    body('basic')
        .optional()
        .isNumeric()
        .withMessage('Basic salary must be a number')
        .isFloat({ min: 0, max: 1000000 })
        .withMessage('Basic salary must be between 0 and 1,000,000')
        .custom((value) => {
            if (value < 0) {
                throw new Error('Basic salary cannot be negative');
            }
            return true;
        }),
    body('allowance')
        .optional()
        .isNumeric()
        .withMessage('Allowance must be a number')
        .isFloat({ min: 0, max: 500000 })
        .withMessage('Allowance must be between 0 and 500,000')
        .custom((value) => {
            if (value < 0) {
                throw new Error('Allowance cannot be negative');
            }
            return true;
        }),
    body('deductions')
        .optional()
        .isNumeric()
        .withMessage('Deductions must be a number')
        .isFloat({ min: 0, max: 100000 })
        .withMessage('Deductions must be between 0 and 100,000')
        .custom((value) => {
            if (value < 0) {
                throw new Error('Deductions cannot be negative');
            }
            return true;
        }),
    body('tax')
        .optional()
        .isNumeric()
        .withMessage('Tax must be a number')
        .isFloat({ min: 0, max: 200000 })
        .withMessage('Tax must be between 0 and 200,000')
        .custom((value) => {
            if (value < 0) {
                throw new Error('Tax cannot be negative');
            }
            return true;
        }),
    body('paidOn')
        .optional()
        .isISO8601()
        .withMessage('Invalid paid date format')
        .custom((value) => {
            const paidDate = new Date(value);
            const today = new Date();
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(today.getFullYear() - 1);
            
            // Paid date cannot be in the future
            if (paidDate > today) {
                throw new Error('Paid date cannot be in the future');
            }
            
            // Paid date cannot be more than 1 year ago
            if (paidDate < oneYearAgo) {
                throw new Error('Paid date cannot be more than 1 year ago');
            }
            
            return true;
        }),
    body('payslipUrl')
        .optional()
        .isURL({ protocols: ['http', 'https'], require_protocol: false })
        .withMessage('Invalid payslip URL format')
        .isLength({ max: 500 })
        .withMessage('Payslip URL cannot exceed 500 characters')
        .custom((value) => {
            // Basic security check for payslip URL
            const allowedExtensions = ['.pdf', '.doc', '.docx'];
            const hasValidExtension = allowedExtensions.some(ext => 
                value.toLowerCase().includes(ext)
            );
            
            if (!hasValidExtension) {
                throw new Error('Payslip URL must point to a valid document (PDF, DOC, DOCX)');
            }
            
            return true;
        }),
    // Custom validation to ensure salary calculation makes sense
    body()
        .custom((body) => {
            const { basic, allowance, deductions, tax } = body;
            
            // If any salary components are provided, validate the calculation
            if (basic !== undefined || allowance !== undefined || 
                deductions !== undefined || tax !== undefined) {
                
                const basicVal = parseFloat(basic) || 0;
                const allowanceVal = parseFloat(allowance) || 0;
                const deductionsVal = parseFloat(deductions) || 0;
                const taxVal = parseFloat(tax) || 0;
                
                const grossSalary = basicVal + allowanceVal;
                const totalDeductions = deductionsVal + taxVal;
                
                // Ensure deductions don't exceed gross salary
                if (totalDeductions > grossSalary) {
                    throw new Error('Total deductions cannot exceed gross salary');
                }
                
                // Ensure basic salary is reasonable compared to allowances
                if (allowanceVal > basicVal * 2) {
                    throw new Error('Allowance cannot be more than twice the basic salary');
                }
                
                // Ensure tax is reasonable (not more than 50% of basic)
                if (taxVal > basicVal * 0.5) {
                    throw new Error('Tax cannot exceed 50% of basic salary');
                }
            }
            
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }
        next();
    }
];
