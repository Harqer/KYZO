import express from 'express';
import { ClerkAuthController } from '../controllers/clerkAuthController';
import { requireAuth, withAuth } from '../config/clerk';

const router = express.Router();
const clerkAuthController = new ClerkAuthController();

// Webhook endpoint for Clerk events (including AI features)
router.post('/webhook', clerkAuthController.handleWebhook);

// Get current user (requires authentication)
router.get('/me', requireAuth, (req, res) => clerkAuthController.getCurrentUser(req as any, res));

// Get current user (optional authentication - supports first-day-free users)
router.get('/user', withAuth, (req, res) => clerkAuthController.getCurrentUser(req as any, res));

// AI-protected routes with rate limiting and bot detection
router.get('/ai-status', requireAuth, async (req, res) => {
  const authReq = req as any;
  res.json({
    success: true,
    data: {
      aiFeatures: {
        botProtection: true,
        rateLimiting: true,
        fingerprinting: true,
        firstDayFree: true,
      },
      userStatus: {
        isAuthenticated: !!authReq.auth?.userId,
        isFirstDay: authReq.auth?.session?.createdAt ? 
          new Date(authReq.auth.session.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000 : false,
      },
    },
  });
});

// Check if user is eligible for AI features
router.get('/ai-eligibility', withAuth, async (req, res) => {
  try {
    const authReq = req as any;
    const userId = authReq.auth?.userId;
    
    if (!userId) {
      return res.json({
        success: true,
        data: {
          eligible: false,
          reason: 'not_authenticated',
          message: 'Sign up to access AI features',
        },
      });
    }

    // Get user from Clerk to check creation date
    const { clerk } = await import('../config/clerk');
    const clerkUser = await clerk.users.getUser(userId);
    
    const isFirstDay = clerkAuthController.isFirstDayUser(clerkUser.createdAt);
    
    return res.json({
      success: true,
      data: {
        eligible: true,
        isFirstDay,
        features: {
          basic: true,
          advanced: !isFirstDay, // Advanced features after first day
          premium: false, // Premium features for paid users
        },
      },
    });
  } catch (error) {
    console.error('AI eligibility check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check eligibility',
    });
  }
});

export default router;
