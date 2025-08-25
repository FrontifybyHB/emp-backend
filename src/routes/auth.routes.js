import express from 'express';
import { registerUserController, loginUserController, refreshTokenController, logoutUserController, getAllUsersController } from '../controllers/auth.controller.js';
import { authLimiter, apiLimiter } from "../middlewares/ratelimit.middleware.js";
import { registerValidator, loginValidator } from '../middlewares/validator.middleaware.js';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

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


router.post('/refresh-token',
    authLimiter,
    refreshTokenController
);

router.post('/logout',
    logoutUserController
);

router.get('/get-all-users',
    apiLimiter,
    requireAuth,
    requireAdmin,
    getAllUsersController
);



export default router;
