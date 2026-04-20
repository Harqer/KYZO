# Clerk Configuration

This file contains the Clerk configuration for the fashion app.

## Setup Instructions

1. **Get Clerk Keys from Dashboard**
   - Visit: https://dashboard.clerk.com/apps/app_3CYawDm7T7XGmnvburusgmA8YmB/instances/ins_3CYawIZHtZG4omqV2eC3SZOXw8b
   - Copy your Publishable Key and Secret Key

2. **Environment Variables**
   Add these to your `.env` file:
   ```
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   EXPO_PUBLIC_CLERK_SECRET_KEY=sk_test_...
   ```

3. **Clerk Provider Setup**
   The app uses Clerk for authentication with the following components:
   - SignIn, SignUp, UserButton
   - Protected routes with authentication checks
   - User session management

## Next Steps

After setting up Clerk keys:
- Configure authentication screens
- Add protected routes
- Set up user profile management
- Test authentication flow
