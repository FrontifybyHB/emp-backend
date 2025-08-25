// controllers/auth.controller.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { findOneUser, createUser, findUserById, findUsers } from '../dao/user.dao.js';
import { generateTokens } from "../utils/jwt.js";
import config from '../config/config.js';


export const registerUserController = async (req, res, next) => {
    try {
        const { username, email, password, adminCode } = req.body;

        // check if user exists
        const userExists = await findOneUser({ email, username });
        if (userExists) return res.status(400).json({ message: 'User already exists', success: false });

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Decide role based on email 
        let role = 'employee';
        let isAdmin = false;

        // Check for admin registration with secret code
        if (adminCode === config.ADMIN_SECRET_CODE) {
            role = 'admin';
            isAdmin = true;

        } else {
            // Role assignment based on email (but not admin)
            if (email.includes('hr')) {
                role = 'hr';
            } else if (email.includes('manager')) {
                role = 'manager';
            }
        }

        // Get current date in IST
        const date = new Date();

        // create user
        const user = await createUser({ username, email, password: hashedPassword, role, lastLogin: date, isAdmin });
        await user.save();
        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Save refresh token in cookie
        user.refreshToken = refreshToken;
        await user.save();
        res.cookie('refreshToken', refreshToken, { httpOnly: true });
        res.cookie('accessToken', accessToken, { httpOnly: true });

        return res.status(201).json({
            message: 'User registered successfully',
            success: true,
            user: {
                id: user._id,
                name: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

export const loginUserController = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        const user = await findOneUser({ $or: [{ username }, { email }] });
        if (!user) return res.status(401).json({ message: 'Invalid email or password', success: false });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Save refresh token in cookie
        user.refreshToken = refreshToken;
        user.lastLogin = new Date();
        await user.save();
        res.cookie('refreshToken', refreshToken, { httpOnly: true });
        res.cookie('accessToken', accessToken, { httpOnly: true });

        res.status(200).json({
            message: 'Login successful',
            success: true,
            user: {
                id: user._id,
                name: user.username,
                email: user.email,
                role: user.role
            }
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
        const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);

        // Find user and check if refresh token matches
        const user = await findUserById(decoded.id);
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({
                message: 'Invalid refresh token',
                success: false
            });
        }

        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

        // Update refresh token in database
        user.refreshToken = newRefreshToken;
        await user.save();

        // Set new tokens in cookies
        res.cookie('refreshToken', newRefreshToken, { httpOnly: true });
        res.cookie('accessToken', accessToken, { httpOnly: true });

        res.json({
            message: 'Token refreshed successfully',
            success: true,
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Refresh token expired',
                success: false
            });
        }
        next(error);
    }
};

export const logoutUserController = async (req, res, next) => {
    try {
        res.clearCookie('refreshToken');
        res.clearCookie('accessToken');

        res.json({ message: 'Logged out successfully', success: true });
    } catch (error) {
        next(error);
    }
};

export const getAllUsersController = async (req, res, next) => {
    try {
        const users = await findUsers();
        res.json({ message: 'Users fetched successfully', success: true, data: users });
    } catch (error) {
        next(error);
    }
};


