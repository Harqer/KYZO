import { Request, Response } from 'express';
import { clerk } from '../config/clerk';
import { UserService } from '../services/userService';
import { ApiResponse, ClerkAuthRequest } from '../types';

export class ClerkAuthController {
  private userService = new UserService();

  // Get current user information from Clerk
  getCurrentUser = async (req: ClerkAuthRequest, res: Response): Promise<Response | undefined> => {
    try {
      const userId = req.auth?.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        } as ApiResponse);
      }

      // Get user from Clerk
      const clerkUser = await clerk.users.getUser(userId);
      
      // Get or create user in our database
      let dbUser = await this.userService.findByEmail(clerkUser.emailAddresses[0]?.emailAddress || '');
      
      if (!dbUser) {
        // Create user in our database for first-time users
        dbUser = await this.userService.create({
          clerkId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
          avatar: clerkUser.imageUrl || '',
        });
      }

      return res.json({
        success: true,
        data: {
          user: {
            id: dbUser.id,
            clerkId: dbUser.clerkId,
            email: dbUser.email,
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            avatar: dbUser.avatar,
            // Include AI-specific user data
            isFirstDay: this.isFirstDayUser(clerkUser.createdAt),
            isVerified: clerkUser.emailAddresses[0]?.verification?.status === 'verified',
          },
        },
      } as ApiResponse);
    } catch (error) {
      console.error('Get current user error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      } as ApiResponse);
    }
  };

  // Handle webhook events from Clerk (for AI features)
  handleWebhook = async (req: Request, res: Response): Promise<Response> => {
    try {
      const event = req.body;
      
      switch (event.type) {
        case 'user.created':
          await this.handleUserCreated(event.data);
          break;
        case 'session.created':
          await this.handleSessionCreated(event.data);
          break;
        case 'session.ended':
          await this.handleSessionEnded(event.data);
          break;
        // AI-specific events
        case 'bot.detected':
          await this.handleBotDetection(event.data);
          break;
        case 'abuse.blocked':
          await this.handleAbuseBlocked(event.data);
          break;
      }

      return res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      return res.status(500).json({
        success: false,
        error: 'Webhook processing failed',
      } as ApiResponse);
    }
  };

  // Check if user is in their first day (for first-day-free pricing)
  isFirstDayUser(createdAt: string): boolean {
    const created = new Date(createdAt);
    const now = new Date();
    const diffInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24;
  }

  // Handle user creation event
  private async handleUserCreated(userData: any) {
    try {
      // Check for disposable email
      const email = userData.email_addresses[0]?.emailAddress;
      if (this.isDisposableEmail(email)) {
        console.log(`Disposable email detected: ${email}`);
        // You could flag this user or take other actions
      }

      // Create user in our database
      await this.userService.create({
        clerkId: userData.id,
        email: email || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        avatar: userData.imageUrl || '',
      });
    } catch (error) {
      console.error('Handle user created error:', error);
    }
  }

  // Handle session creation (for AI analytics)
  private async handleSessionCreated(sessionData: any) {
    try {
      // Log session for AI analytics
      console.log(`Session created for user: ${sessionData.user_id}`);
      
      // You could implement rate limiting checks here
      // or other AI-powered session analysis
    } catch (error) {
      console.error('Handle session created error:', error);
    }
  }

  // Handle session ended
  private async handleSessionEnded(sessionData: any) {
    try {
      console.log(`Session ended for user: ${sessionData.user_id}`);
      // Clean up any session-specific data
    } catch (error) {
      console.error('Handle session ended error:', error);
    }
  }

  // Handle bot detection
  private async handleBotDetection(botData: any) {
    try {
      console.log(`Bot detected: ${JSON.stringify(botData)}`);
      // Implement bot blocking logic
      // This could involve IP blocking, account suspension, etc.
    } catch (error) {
      console.error('Handle bot detection error:', error);
    }
  }

  // Handle abuse detection
  private async handleAbuseBlocked(abuseData: any) {
    try {
      console.log(`Abuse blocked: ${JSON.stringify(abuseData)}`);
      // Implement abuse handling logic
      // This could involve notifying admins, escalating security, etc.
    } catch (error) {
      console.error('Handle abuse blocked error:', error);
    }
  }

  // Simple disposable email detection
  private isDisposableEmail(email: string): boolean {
    const disposableDomains = [
      '10minutemail.com',
      'tempmail.org',
      'guerrillamail.com',
      'mailinator.com',
      // Add more disposable email domains
    ];
    
    const domain = email.split('@')[1]?.toLowerCase();
    return disposableDomains.some(disposable => domain?.includes(disposable));
  }
}
