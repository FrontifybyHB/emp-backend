import jwt from "jsonwebtoken";
import config from "../config/config.js";

export const requireAuth = (req, res, next) => {
    // First check Authorization header
    const auth = req.headers.authorization;
    let token;

    if (auth && auth.startsWith("Bearer ")) {
        token = auth.split(" ")[1];
    } else if (req.cookies && req.cookies.accessToken) {
        // Fallback to cookie if no Authorization header
        token = req.cookies.accessToken;
    }

    if (!token) {
        return res.status(401).json({ message: "Missing token" });
    }

    try {
        const payload = jwt.verify(token, config.jwtSecret);
        req.user = { id: payload.id, role: payload.role };
        next();
    } catch (err) {
        console.warn("Invalid token", err);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

export const requireRefreshAuth = async (req, res, next) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ message: "Missing refresh token" });
    }

    try {
        const payload = jwt.verify(refreshToken, config.jwtRefreshSecret);
        const user = await findUserById(payload.id);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        req.user = user._id;
        // console.log(req.user)
        next();
    } catch (err) {
        console.warn("Invalid refresh token", err);
        return res.status(401).json({ message: "Invalid refresh token" });
    }
};

export const refreshToken = async (req, res, next) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ message: "Missing refresh token" });
    }

    try {
        const payload = jwt.verify(refreshToken, config.jwtRefreshSecret);
        const user = await findUserById(payload.id);
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
        user.refreshToken = newRefreshToken;
        await user.save();
        res.cookie('refreshToken', newRefreshToken, { httpOnly: true });
        res.cookie('accessToken', accessToken, { httpOnly: true });
        res.json({ accessToken });
    } catch (err) {
        console.warn("Invalid refresh token", err);
        return res.status(401).json({ message: "Invalid refresh token" });
    }
};

export const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden – insufficient role" });
    }
    next();
};



export const permit = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (allowedRoles.includes(req.user.role)) {
            return next();
        }
        return res.status(403).json({ message: "Forbidden – insufficient role" });
    };
};