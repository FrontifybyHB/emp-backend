import jwt from "jsonwebtoken";
import config from "../config/config.js";

// Generate Access Token
export const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiry || "15m" }
    );

    const refreshToken = jwt.sign(
        { id: user._id },
        config.jwtRefreshSecret,
        { expiresIn: config.jwtRefreshExpiry || "7d" }
    );

    return { accessToken, refreshToken };
};