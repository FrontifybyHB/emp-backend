import { verifyAccessToken, verifyRefreshToken } from "../utils/jwt.js";
import { findUserById } from "../dao/user.dao.js";
import crypto from 'crypto';

export const requireAuth = async (req, res, next) => {
    try {
        // Extract tokens
        const accessToken = extractAccessToken(req);
        const refreshToken = extractRefreshToken(req);
        
        if (!accessToken) {
            return res.status(401).json({ 
                message: "Access token required",
                success: false 
            });
        }

        // Verify access token
        const payload = verifyAccessToken(accessToken);
        if (!payload) {
            return res.status(401).json({ 
                message: "Invalid or expired token",
                success: false 
            });
        }

        // Verify user exists
        const user = await findUserById(payload.id, 'role isAdmin refreshToken');
        if (!user) {
            return res.status(401).json({ 
                message: "User not found",
                success: false 
            });
        }

        // Verify refresh token if provided
        if (refreshToken) {
            const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
            if (user.refreshToken !== refreshTokenHash) {
                return res.status(401).json({ 
                    message: "Invalid refresh token",
                    success: false 
                });
            }
        }

        // Attach user and tokens to request
        req.user = {
            id: payload.id,
            role: user.role,
            isAdmin: user.isAdmin
        };
        
        req.tokens = {
            accessToken,
            refreshToken
        };

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
    return req.cookies?.refreshToken || null;
};