import React from 'react';
import { ClerkProvider as ExpoClerkProvider, ClerkLoaded, SignedIn, SignedOut } from '@clerk/expo';
import { tokenCache } from '@clerk/expo-token-cache';

// Clerk configuration
const clerkConfig = {
  tokenCache,
  // Add your Clerk configuration here
};

export function ClerkContextProvider({ children }: { children: React.ReactNode }) {
  return (
    <ExpoClerkProvider {...clerkConfig}>
      <ClerkLoaded>
        <SignedIn>
          {children}
        </SignedIn>
        <SignedOut>
          <div style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <p>Please sign in to continue</p>
          </div>
        </SignedOut>
      </ClerkLoaded>
    </ExpoClerkProvider>
  );
}
