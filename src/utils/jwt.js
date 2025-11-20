import jwt from "jsonwebtoken";
import config from "../config/config.js";

export const generateTokens = (user) => {
    const payload = {
        id: user._id,
        role: user.role,
        isAdmin: user.isAdmin,
        iat: Math.floor(Date.now() / 1000)
    };

    const accessToken = jwt.sign(
        payload,
        config.jwtSecret,
        {
            expiresIn: config.jwtExpiry || "24h",
            issuer: 'ems-backend',
            audience: 'ems-client'
        }
    );

    const refreshToken = jwt.sign(
        { id: user._id },
        config.jwtRefresh,
        {
            expiresIn: "7d",
            issuer: 'ems-backend',
            audience: 'ems-client'
        }
    );

    return { accessToken, refreshToken };
};

export const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, config.jwtSecret, {
            issuer: 'ems-backend',
            audience: 'ems-client'
        });
    } catch (error) {
        return null;
    }
};

export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, config.jwtSecret, {
            issuer: 'ems-backend',
            audience: 'ems-client'
        });
    } catch (error) {
        return null;
    }
};
