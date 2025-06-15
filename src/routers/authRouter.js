import { Router } from 'express';
import { requestPasswordReset, verifyResetCode, resetPassword } from "../controllers/authController.js";

import {
    login,
} from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.post('/request-reset', requestPasswordReset);
router.post('/verify-code', verifyResetCode);
router.post('/reset-password', resetPassword);

export default router;