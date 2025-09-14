import express from 'express';
import { 
    registerUserController, 
    loginUserController, 
    logoutUserController,
    getAllUsersController 
} from '../controllers/auth.controller.js';
import { authLimiter, apiLimiter } from "../middlewares/ratelimit.middleware.js";
import { registerValidator, loginValidator } from '../middlewares/validator.middleaware.js';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/register',
    registerValidator,
    authLimiter,
    registerUserController
);

router.post('/login',
    loginValidator,
    authLimiter,
    loginUserController
);


// Protected routes
router.post('/logout',
    requireAuth,
    logoutUserController
);

router.get('/users',
    apiLimiter,
    requireAuth,
    requireAdmin,
    getAllUsersController
);

// Health check for auth service
router.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'Auth Service',
        timestamp: new Date().toISOString()
    });
});

export default router;