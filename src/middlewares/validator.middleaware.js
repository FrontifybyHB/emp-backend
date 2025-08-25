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