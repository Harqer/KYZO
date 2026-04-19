// Test script for JWT verification
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testJWTVerification() {
  console.log('Testing Clerk JWT Verification...\n');

  try {
    // Test 1: Get public key
    console.log('1. Testing public key endpoint...');
    const publicKeyResponse = await axios.get(`${BASE_URL}/api/jwt-test/public-key`);
    console.log('   Public key retrieved successfully');
    console.log('   Issuer:', publicKeyResponse.data.data.issuer);
    console.log('   Algorithm:', publicKeyResponse.data.data.algorithm);
    console.log('   Status:', publicKeyResponse.data.success ? 'SUCCESS' : 'FAILED');
    console.log('');

    // Test 2: Test token verification (will fail without valid token)
    console.log('2. Testing token verification endpoint...');
    try {
      const verifyResponse = await axios.post(`${BASE_URL}/api/jwt-test/verify`, {
        token: 'invalid_token_here'
      });
      console.log('   Unexpected success - this should fail');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('   Correctly rejected invalid token');
        console.log('   Status: SUCCESS (expected failure)');
      } else {
        console.log('   Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 3: Test token decoding
    console.log('3. Testing token decoding endpoint...');
    try {
      const decodeResponse = await axios.post(`${BASE_URL}/api/jwt-test/decode`, {
        token: 'invalid_token_here'
      });
      console.log('   Unexpected success - this should fail');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('   Correctly rejected invalid token for decoding');
        console.log('   Status: SUCCESS (expected failure)');
      } else {
        console.log('   Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 4: Test Clerk AI status
    console.log('4. Testing Clerk AI status endpoint...');
    try {
      const aiStatusResponse = await axios.get(`${BASE_URL}/api/clerk/ai-status`);
      console.log('   AI Status endpoint working');
      console.log('   Status:', aiStatusResponse.data.success ? 'SUCCESS' : 'FAILED');
      if (aiStatusResponse.data.success) {
        console.log('   AI Features:', JSON.stringify(aiStatusResponse.data.data.aiFeatures, null, 2));
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('   Correctly requires authentication');
        console.log('   Status: SUCCESS (expected authentication required)');
      } else {
        console.log('   Error:', error.message);
      }
    }
    console.log('');

    console.log('JWT Verification Tests Complete!');
    console.log('\nTo test with a real Clerk token:');
    console.log('1. Sign in to your Clerk application');
    console.log('2. Get the session token from your frontend');
    console.log('3. Use this curl command to test:');
    console.log(`curl -X POST ${BASE_URL}/api/jwt-test/verify \\`);
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"token": "YOUR_CLERK_SESSION_TOKEN"}\'');

  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\nMake sure your server is running on port 5000');
      console.log('Run: npm run dev');
    }
  }
}

// Run the test
if (require.main === module) {
  testJWTVerification();
}

module.exports = testJWTVerification;
