// routes/auth.routes.js
import express from 'express';
import { registerUserController, loginUserController, refreshTokenController, logoutUserController } from '../controllers/auth.controller.js';
import { authLimiter } from "../middlewares/ratelimit.middleware.js";
import { registerValidator, loginValidator } from '../middlewares/validator.middleaware.js';

const router = express.Router();

// @desc Register a new user
// @route POST /auth/register
router.post('/register',
    registerValidator,
    authLimiter,
    registerUserController
);

// @desc Login user
// @route POST /auth/login
router.post('/login',
    loginValidator,
    authLimiter,
    loginUserController
);

// @desc Refresh token
// @route POST /auth/refresh-token
router.post('/refresh-token',
    authLimiter,
    refreshTokenController
);


// @desc Logout user
// @route POST /auth/logout
router.post('/logout',
    logoutUserController
);



export default router;
