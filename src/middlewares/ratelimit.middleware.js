// src/middleware/rateLimiter.js
import rateLimit from "express-rate-limit";

/**
 * General API rate limiter
 * Example: max 200 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 200,
    message: {
        message: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: "draft-7", // return rate limit info in headers
    legacyHeaders: false,       // disable deprecated X-RateLimit-* headers
});

/**
 * Stricter limiter for authentication routes
 * Example: max 10 requests per 5 minutes per IP
 */
export const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    limit: 10,
    message: {
        message: "Too many login attempts, please try again later.",
    },
    standardHeaders: "draft-7",
    legacyHeaders: false,
});
