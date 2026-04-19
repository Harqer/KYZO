import express from 'express';
import { AuthController } from '../controllers/authController';
import { validateRequest } from '../middleware/validation';
import { loginSchema, registerSchema } from '../utils/validation';

const router = express.Router();
const authController = new AuthController();

// Register user
router.post('/register', validateRequest(registerSchema), authController.register);

// Login user
router.post('/login', validateRequest(loginSchema), authController.login);

// Logout user
router.post('/logout', authController.logout);

// Refresh token
router.post('/refresh', authController.refreshToken);

export default router;
