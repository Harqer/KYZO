import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend the Request interface to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username?: string;
        fullName?: string;
      };
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      fullName: decoded.fullName,
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        req.user = {
          id: decoded.id,
          email: decoded.email,
          username: decoded.username,
          fullName: decoded.fullName,
        };
      }
    }
    
    next();
  } catch (error) {
    // For optional auth, we don't return an error, just continue without user
    next();
  }
};
