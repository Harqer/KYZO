/**
 * ATOM: Authentication Middleware
 * Atomic Design Pattern - Smallest reusable unit
 */

import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '../config/clerk';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any;
}

// Authentication middleware atom
export const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Verify token with Clerk
    const { userId } = await clerkClient.verifyToken(token);
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Invalid authentication token',
      });
      return;
    }

    // Add user info to request
    req.userId = userId;
    req.user = { userId };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

// Export authentication atom
export { authenticateUser, AuthenticatedRequest };
