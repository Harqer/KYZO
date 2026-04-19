import { ClerkExpressRequireAuth, ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { verifyClerkJWT } from './jwtVerification';
import dotenv from 'dotenv';

dotenv.config();

// Export clerk client for authentication middleware
export { clerkClient };

// Clerk configuration with AI authentication features
export const clerkConfig = {
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
  // Your Clerk domain from the JWKS
  domain: 'https://assuring-bear-40.clerk.accounts.dev',
  // AI-specific configuration
  aiFeatures: {
    // Enable bot protection and abuse detection
    botProtection: true,
    // Enable rate limiting for AI endpoints
    rateLimiting: true,
    // Enable fingerprinting for enhanced security
    fingerprinting: true,
    // First day free pricing model
    firstDayFree: true,
  },
};

// Initialize Clerk client
export const clerk = clerkClient({
  secretKey: clerkConfig.secretKey,
  publishableKey: clerkConfig.publishableKey,
});

// Middleware for requiring authentication
export const requireAuth = ClerkExpressRequireAuth({
  // Add AI-specific options
  authorizedParties: [process.env.FRONTEND_URL || 'http://localhost:3000'],
  // JWT verification options
  jwtKey: clerkConfig.secretKey,
  issuer: clerkConfig.domain,
});

// Middleware for optional authentication (supports first-day-free users)
export const withAuth = ClerkExpressWithAuth({
  // Allow unauthenticated users for first-day-free experience
  authorizedParties: [process.env.FRONTEND_URL || 'http://localhost:3000'],
  // Add custom logic for AI features
  afterSignOutUrl: '/sign-in',
  // JWT verification options
  jwtKey: clerkConfig.secretKey,
  issuer: clerkConfig.domain,
});

// Custom JWT verification middleware (alternative to ClerkExpressRequireAuth)
export const customRequireAuth = (req: any, res: any, next: any) => {
  verifyClerkJWT(req, res, next);
};

// AI-specific rate limiting middleware
export const aiRateLimit = (req: Request, res: Response, next: Function) => {
  // Implementation for AI-specific rate limiting
  // This would integrate with Clerk's rate limiting features
  next();
};

// Bot detection middleware
export const botDetection = (req: Request, res: Response, next: Function) => {
  // Implementation for bot detection using Clerk's fingerprinting
  // This would check for suspicious patterns and block bots
  next();
};
