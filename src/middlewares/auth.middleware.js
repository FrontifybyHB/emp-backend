import { verifyAccessToken, verifyRefreshToken, generateTokens } from "../utils/jwt.js";
import { findUserById } from "../dao/user.dao.js";
import crypto from 'crypto';

export const requireAuth = async (req, res, next) => {
    try {
        // Extract token
        const token = extractAccessToken(req);

        if (!token) {
            return res.status(401).json({
                message: "Token required",
                success: false
            });
        }

        // Verify token
        const payload = verifyAccessToken(token);
        if (!payload) {
            return res.status(401).json({
                message: "Invalid or expired token",
                success: false
            });
        }

        // Verify user exists
        const user = await findUserById(payload.id, 'role isAdmin');
        if (!user) {
            return res.status(401).json({
                message: "User not found",
                success: false
            });
        }

        // Attach user and token to request
        req.user = {
            id: payload.id,
            role: user.role,
            isAdmin: user.isAdmin
        };

        req.token = token;

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Authentication failed",
            success: false
        });
    }
};

export const requireAdmin = (req, res, next) => {
    if (!req.user?.isAdmin) {
        return res.status(403).json({
            message: "Admin access required",
            success: false
        });
    }
    next();
};

export const permit = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required",
                success: false
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Insufficient permissions",
                success: false
            });
        }

        next();
    };
};

export const refreshAccessToken = async (req, res, next) => {
    try {
        // Extract refresh token
        const refreshToken = extractRefreshToken(req);

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token required",
                success: false
            });
        }

        // Verify refresh token
        const payload = verifyRefreshToken(refreshToken);
        if (!payload) {
            return res.status(401).json({
                message: "Invalid or expired refresh token",
                success: false
            });
        }

        // Verify user exists
        const user = await findUserById(payload.id, 'role isAdmin');
        if (!user) {
            return res.status(401).json({
                message: "User not found",
                success: false
            });
        }

        // Generate new access token
        const { accessToken } = generateTokens(user);

        // Set new access token cookie
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        return res.status(200).json({
            message: "Access token refreshed successfully",
            success: true
        });
    } catch (error) {
        return res.status(401).json({
            message: "Token refresh failed",
            success: false
        });
    }
};

// Helper functions
const extractAccessToken = (req) => {
    const auth = req.headers.authorization;

    if (auth && auth.startsWith("Bearer ")) {
        return auth.split(" ")[1];
    }

    if (req.cookies?.accessToken) {
        return req.cookies.accessToken;
    }

    return null;
};

const extractRefreshToken = (req) => {
    if (req.cookies?.refreshToken) {
        return req.cookies.refreshToken;
    }

    return null;
};
