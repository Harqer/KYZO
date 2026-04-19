import React from 'react';
import { ClerkProvider, SignedIn, SignedOut, SignIn, SignUp, UserButton } from '@clerk/clerk-react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Your Clerk publishable key
const clerkPublishableKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || 'pk_test_YXNzdXJpbmctYmVhci00MC5jbGVyay5hY2NvdW50cy5kZXY$';

function App() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <h1 className="text-xl font-semibold text-gray-900">Fashion AI App</h1>
                <SignedIn>
                  <UserButton afterSignOutUrl="/sign-in" />
                </SignedIn>
              </div>
            </div>
          </header>

          <main>
            <Routes>
              <Route path="/sign-in" element={<SignInPage />} />
              <Route path="/sign-up" element={<SignUpPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ClerkProvider>
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <a href="/sign-up" className="font-medium text-indigo-600 hover:text-indigo-500">
            create a new account
          </a>
        </p>
        <div className="mt-8">
          <SignIn 
            path="/sign-in"
            routing="path"
            redirectUrl="/dashboard"
            afterSignInUrl="/dashboard"
          />
        </div>
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <a href="/sign-in" className="font-medium text-indigo-600 hover:text-indigo-500">
            sign in to your existing account
          </a>
        </p>
        <div className="mt-8">
          <SignUp 
            path="/sign-up"
            routing="path"
            redirectUrl="/dashboard"
            afterSignUpUrl="/dashboard"
          />
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  );
}

function Dashboard() {
  const [aiStatus, setAiStatus] = React.useState<any>(null);
  const [aiEligibility, setAiEligibility] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchAIStatus();
    fetchAIEligibility();
  }, []);

  const fetchAIStatus = async () => {
    try {
      const response = await fetch('/api/clerk/ai-status');
      const data = await response.json();
      setAiStatus(data.data);
    } catch (error) {
      console.error('Failed to fetch AI status:', error);
    }
  };

  const fetchAIEligibility = async () => {
    try {
      const response = await fetch('/api/clerk/ai-eligibility');
      const data = await response.json();
      setAiEligibility(data.data);
    } catch (error) {
      console.error('Failed to fetch AI eligibility:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Fashion AI Dashboard</h1>
          
          {/* AI Status Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Authentication Status</h2>
            {aiStatus && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Bot Protection:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    aiStatus.aiFeatures.botProtection 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {aiStatus.aiFeatures.botProtection ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Rate Limiting:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    aiStatus.aiFeatures.rateLimiting 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {aiStatus.aiFeatures.rateLimiting ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Fingerprinting:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    aiStatus.aiFeatures.fingerprinting 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {aiStatus.aiFeatures.fingerprinting ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">First Day Free:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    aiStatus.aiFeatures.firstDayFree 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {aiStatus.aiFeatures.firstDayFree ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* AI Eligibility Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Features Eligibility</h2>
            {aiEligibility && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Eligible for AI:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    aiEligibility.eligible 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {aiEligibility.eligible ? 'Yes' : 'No'}
                  </span>
                </div>
                {aiEligibility.isFirstDay !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">First Day User:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      aiEligibility.isFirstDay 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {aiEligibility.isFirstDay ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
                {aiEligibility.features && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Available Features:</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Basic Features:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          aiEligibility.features.basic 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {aiEligibility.features.basic ? 'Available' : 'Locked'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Advanced Features:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          aiEligibility.features.advanced 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {aiEligibility.features.advanced ? 'Available' : 'Locked'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Premium Features:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          aiEligibility.features.premium 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {aiEligibility.features.premium ? 'Available' : 'Locked'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Welcome Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Welcome to Fashion AI! 
            </h3>
            <p className="text-sm text-blue-700">
              {aiEligibility?.isFirstDay 
                ? "You're in your first day! Enjoy free access to basic AI features. Advanced features will unlock after 24 hours."
                : "You have access to all available AI features. Start exploring our fashion AI tools!"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
