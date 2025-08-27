import crypto from 'crypto';
import { findOneUser, createUser, findUserById, findUsers, updateUser, getAllUsers } from '../dao/user.dao.js';
import { generateTokens, verifyRefreshToken } from "../utils/jwt.js";
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
        const { accessToken, refreshToken } = generateTokens(user);

        // Save refresh token hash (not plain text)
        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        await updateUser(user._id, { refreshToken: refreshTokenHash });

        // Set secure cookies
        setSecureCookies(res, accessToken, refreshToken);

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
        const { accessToken, refreshToken } = generateTokens(user);

        // Save refresh token hash
        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

        // Update user login info
        await updateUser(user._id, {
            refreshToken: refreshTokenHash,
        });

        // Set secure cookies
        setSecureCookies(res, accessToken, refreshToken);

        res.status(200).json({
            message: 'Login successful',
            success: true,
            user: sanitizeUser(user)
        });
    } catch (error) {
        next(error);
    }
};

export const refreshTokenController = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                message: 'Refresh token not found',
                success: false
            });
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(401).json({
                message: 'Invalid refresh token',
                success: false
            });
        }

        // Find user and verify stored refresh token
        const user = await findUserById(decoded.id);
        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

        if (!user || user.refreshToken !== refreshTokenHash) {
            return res.status(401).json({
                message: 'Invalid refresh token',
                success: false
            });
        }

        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

        // Update refresh token hash
        const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
        await updateUser(user._id, { refreshToken: newRefreshTokenHash });

        // Set new secure cookies
        setSecureCookies(res, accessToken, newRefreshToken);

        res.status(200).json({
            message: 'Token refreshed successfully',
            success: true
        });
    } catch (error) {
        next(error);
    }
};

export const logoutUserController = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        // If user is authenticated, clear their refresh token from DB
        if (req.user?.id && refreshToken) {
            await updateUser(req.user.id, { refreshToken: null });
        }

        // Clear cookies with secure options
        res.clearCookie('refreshToken', {
            httpOnly: true,
            sameSite: 'strict'
        });
        res.clearCookie('accessToken', {
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

const setSecureCookies = (res, accessToken, refreshToken) => {
    const cookieOptions = {
        httpOnly: true,
        sameSite: 'strict'
    };

    res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

