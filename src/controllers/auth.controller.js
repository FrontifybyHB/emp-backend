import crypto from 'crypto';
import { findOneUser, createUser, findUserById, findUsers, updateUser, getAllUsers } from '../dao/user.dao.js';
import { generateTokens } from "../utils/jwt.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { sanitizeUser } from "../utils/sanitizer.js";
import config from '../config/config.js';

export const registerUserController = async (req, res, next) => {
    try {
        const { username, email, password, adminCode = null } = req.body;

        // Check if user exists (case-insensitive email)
        const userExists = await findOneUser({
            $or: [
                { email: email.toLowerCase() },
                { username: { $regex: new RegExp(`^${username}$`, 'i') } }
            ]
        });

        if (userExists) {
            return res.status(409).json({
                message: 'User already exists',
                success: false
            });
        }

        // Hash password with higher salt rounds
        const hashedPassword = await hashPassword(password);

        // Role assignment logic
        const roleData = determineUserRole(email, adminCode);

        // Create user with security enhancements
        const userData = {
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: roleData.role,
            isAdmin: roleData.isAdmin,
            lastLogin: new Date(),
        };

        const user = await createUser(userData);

        // Generate tokens
        const { accessToken } = generateTokens(user);

        // Set JWT token in HTTP-only cookie
        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // true in production
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        return res.status(201).json({
            message: 'User registered successfully',
            success: true,
            user: sanitizeUser(user)
        });
    } catch (error) {
        next(error);
    }
};

export const loginUserController = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user with case-insensitive email
        const user = await findOneUser({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(401).json({
                message: 'Invalid credentials',
                success: false
            });
        }


        // Verify password
        const isValidPassword = await comparePassword(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                message: 'Invalid credentials',
                success: false
            });
        }
        // Generate tokens
        const { accessToken } = generateTokens(user);

        // Set JWT token in HTTP-only cookie
        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // true in production
            sameSite: 'strict',
            maxAge: req.body.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 30 days if remember me, else 24 hours
        });

        res.status(200).json({
            message: 'Login successful',
            success: true,
            user: sanitizeUser(user)
        });
    } catch (error) {
        next(error);
    }
};


export const logoutUserController = async (req, res, next) => {
    try {

        const userId = req.body.userId;

        // If user is authenticated, clear their refresh token from DB
        if (userId) {
            await updateUser(userId);
        }

        res.clearCookie('token', {
            httpOnly: true,
            sameSite: 'strict'
        });

        res.status(200).json({
            message: 'Logged out successfully',
            success: true
        });
    } catch (error) {
        next(error);
    }
};

export const getAllUsersController = async (req, res, next) => {
    try {
        const { page, limit, role, sort } = req.query;

        const options = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            sort: sort ? JSON.parse(sort) : { createdAt: -1 },
            role
        };

        const result = await getAllUsers(options);

        res.status(200).json({
            message: 'Users retrieved successfully',
            success: true,
            data: result.users,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

// Helper functions
const determineUserRole = (email, adminCode) => {
    let role = 'employee';
    let isAdmin = false;

    if (adminCode === config.ADMIN_SECRET_CODE) {
        role = 'admin';
        isAdmin = true;
    } else if (email.includes('hr')) {
        role = 'hr';
    } else if (email.includes('manager')) {
        role = 'manager';
    }

    return { role, isAdmin };
};

const setSecureCookies = (res, accessToken) => {
    // Set secure cookies

    res.cookie("token", accessToken, {
        httpOnly: true,   // not accessible from JS (more secure)
        secure: true,     // cookie only sent over HTTPS
        sameSite: "strict", // CSRF protection
        maxAge: 1000 * 60 * 60 * 24, // 1 day
    });

};

