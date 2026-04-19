import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserService } from '../services/userService';
import { ApiResponse, AuthRequest, JwtPayload } from '../types';

export class AuthController {
  private userService = new UserService();

  register = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await this.userService.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists',
        } as ApiResponse);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await this.userService.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
      });

      // Generate JWT token
      const token = this.generateToken(user.id, user.email);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
          },
          token,
        },
      } as ApiResponse);
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  };

  login = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await this.userService.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        } as ApiResponse);
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        } as ApiResponse);
      }

      // Generate JWT token
      const token = this.generateToken(user.id, user.email);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
          },
          token,
        },
      } as ApiResponse);
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  };

  logout = async (req: Request, res: Response): Promise<Response> => {
    // In a real implementation, you might want to blacklist the token
    // For now, we'll just return a success response
    return res.json({
      success: true,
      message: 'Logged out successfully',
    } as ApiResponse);
  };

  refreshToken = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'No token provided',
        } as ApiResponse);
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      
      // Find user
      const user = await this.userService.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
        } as ApiResponse);
      }

      // Generate new token
      const newToken = this.generateToken(user.id, user.email);

      return res.json({
        success: true,
        data: {
          token: newToken,
        },
      } as ApiResponse);
    } catch (error) {
      console.error('Token refresh error:', error);
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      } as ApiResponse);
    }
  };

  private generateToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }
}
