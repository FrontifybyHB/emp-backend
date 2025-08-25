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