# Clerk AI Authentication Integration

This document explains how Clerk AI Authentication has been integrated into the fashion-backend project with advanced bot protection, abuse detection, and first-day-free pricing.

## Overview

The integration includes:
- **Bot Protection**: Advanced fingerprinting and CAPTCHA to block automated access
- **Abuse Detection**: Real-time detection and neutralization of suspicious activities
- **First Day Free**: Users only counted as active after 24 hours
- **Rate Limiting**: Intelligent rate limiting for AI endpoints
- **Disposable Email Detection**: Blocks high-risk disposable email domains

## Installation

The following packages have been installed:
```bash
npm install @clerk/ui @clerk/backend @clerk/express
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Clerk Authentication with AI Features
CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
CLERK_SECRET_KEY=sk_test_your_secret_key
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret

# AI Authentication Features
CLERK_AI_BOT_PROTECTION=true
CLERK_AI_RATE_LIMITING=true
CLERK_AI_FINGERPRINTING=true
CLERK_AI_FIRST_DAY_FREE=true
CLERK_AI_DISPOSABLE_EMAIL_DETECTION=true
```

## Backend Integration

### Key Files Created/Modified

1. **`src/config/clerk.ts`** - Clerk configuration with AI features
2. **`src/controllers/clerkAuthController.ts`** - Handles Clerk authentication and AI features
3. **`src/routes/clerkAuth.ts`** - API routes for Clerk authentication
4. **`src/app.ts`** - Updated to include Clerk routes
5. **`src/types/index.ts`** - Added ClerkAuthRequest interface

### API Endpoints

#### Authentication Endpoints
- `GET /api/clerk/me` - Get current authenticated user
- `GET /api/clerk/user` - Get current user (optional auth)
- `POST /api/clerk/webhook` - Handle Clerk webhook events

#### AI Feature Endpoints
- `GET /api/clerk/ai-status` - Check AI authentication status
- `GET /api/clerk/ai-eligibility` - Check AI feature eligibility

### Example API Responses

#### AI Status Response
```json
{
  "success": true,
  "data": {
    "aiFeatures": {
      "botProtection": true,
      "rateLimiting": true,
      "fingerprinting": true,
      "firstDayFree": true
    },
    "userStatus": {
      "isAuthenticated": true,
      "isFirstDay": false
    }
  }
}
```

#### AI Eligibility Response
```json
{
  "success": true,
  "data": {
    "eligible": true,
    "isFirstDay": false,
    "features": {
      "basic": true,
      "advanced": true,
      "premium": false
    }
  }
}
```

## Frontend Integration

### React Example

See `frontend-example/ClerkAuthProvider.tsx` for a complete React implementation that includes:

1. **Authentication Flow**: Sign-in and sign-up pages
2. **Protected Routes**: Routes that require authentication
3. **AI Status Dashboard**: Shows AI feature availability
4. **User Management**: User button for profile management

### Required Frontend Packages

```bash
npm install @clerk/clerk-react react-router-dom
```

### Frontend Environment Variables

```bash
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

## AI Features

### Bot Protection
- **Fingerprinting**: Network and device analysis to filter automated access
- **CAPTCHA**: Cloudflare Turnstile (99.9% invisible)
- **Rate Limiting**: IP-based rate limiting as fallback

### Abuse Detection
- **Real-time Detection**: Machine learning-based threat detection
- **Disposable Email Blocking**: Automatic detection of disposable email domains
- **Session Monitoring**: Active device monitoring and session revocation

### First Day Free Pricing
- **24-hour Grace Period**: Users only counted after 24 hours
- **Feature Gating**: Different features available based on user age
- **Automatic Transition**: Seamless upgrade from first-day to regular pricing

## Security Features

### Enterprise-Ready Security
- **XSS Protection**: HttpOnly cookies prevent credential leakage
- **CSRF Protection**: SameSite cookie configuration
- **Session Fixation Protection**: Session tokens reset on sign-in/out
- **Password Security**: Integration with HaveIBeenPwned and NIST guidelines

### Session Management
- **Multi-device Support**: Users can manage multiple active sessions
- **Session Revocation**: Immediate session termination capability
- **Sub-millisecond Latency**: Optimized for high-performance applications

## Webhook Events

The system handles these Clerk webhook events:

### Standard Events
- `user.created` - New user registration
- `session.created` - New session started
- `session.ended` - Session terminated

### AI-Specific Events
- `bot.detected` - Bot activity detected
- `abuse.blocked` - Abuse attempt blocked

## Usage Examples

### Protecting AI Endpoints

```typescript
import { requireAuth } from '../config/clerk';

// Protect AI endpoint with authentication
router.post('/api/ai/generate', requireAuth, async (req, res) => {
  // AI logic here
});
```

### Checking User Eligibility

```typescript
const checkAIEligibility = async (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (!userId) {
    return res.json({ eligible: false, reason: 'not_authenticated' });
  }

  const clerkUser = await clerk.users.getUser(userId);
  const isFirstDay = isFirstDayUser(clerkUser.createdAt);
  
  return res.json({
    eligible: true,
    isFirstDay,
    features: {
      basic: true,
      advanced: !isFirstDay,
      premium: false,
    },
  });
};
```

## Testing

### Local Development

1. Set up Clerk account and get API keys
2. Configure environment variables
3. Start the backend server: `npm run dev`
4. Test endpoints using tools like Postman or curl

### Test Commands

```bash
# Test AI status
curl -X GET http://localhost:5000/api/clerk/ai-status

# Test webhook (requires auth)
curl -X POST http://localhost:5000/api/clerk/webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "user.created", "data": {...}}'
```

## Production Deployment

### Required Environment Variables
- `CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key
- `CLERK_SECRET_KEY` - Your Clerk secret key
- `CLERK_WEBHOOK_SECRET` - Your webhook secret for verification

### Security Considerations
- Ensure all Clerk keys are stored securely
- Use HTTPS in production
- Configure proper CORS settings
- Set up webhook endpoint verification

## Monitoring

### Key Metrics to Monitor
- Authentication success/failure rates
- Bot detection frequency
- Abuse prevention effectiveness
- First-day user conversion rates

### Logging
The system logs important events:
- User creation and authentication
- Bot detection events
- Abuse blocking incidents
- Session management activities

## Troubleshooting

### Common Issues

1. **Clerk keys not working**: Verify keys are correct and properly configured
2. **Webhook failures**: Check webhook secret and endpoint availability
3. **AI features not working**: Ensure AI feature flags are enabled in environment
4. **First-day detection issues**: Verify user creation date handling

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

## Support

For issues related to:
- **Clerk Integration**: Check Clerk documentation at https://clerk.com/docs
- **AI Features**: Review AI authentication guide at https://clerk.com/ai-authentication
- **This Implementation**: Check the code comments and this documentation

## Next Steps

1. **Set up Clerk Dashboard**: Configure your application in Clerk dashboard
2. **Customize AI Features**: Adjust bot detection sensitivity and rate limits
3. **Implement Frontend**: Use the provided React example as a starting point
4. **Monitor Performance**: Set up monitoring for authentication and AI features
5. **Test Thoroughly**: Test all authentication flows and AI feature gating

## License

This integration follows the same license as the main fashion-backend project.
