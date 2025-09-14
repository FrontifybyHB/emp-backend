import rateLimit from "express-rate-limit";


export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100,
    message: {
        message: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: "draft-7",
    legacyHeaders: false,   
});


export const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    limit: 10,
    message: {
        message: "Too many login attempts, please try again later.",
    },
    standardHeaders: "draft-7",
    legacyHeaders: false,
});
