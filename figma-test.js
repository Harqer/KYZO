// Simple test script to check Figma API access
const https = require('https');

// You'll need to replace this with your actual Figma access token
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN || '';

if (!FIGMA_ACCESS_TOKEN) {
  console.log('Please set FIGMA_ACCESS_TOKEN environment variable');
  process.exit(1);
}

// Test getting user info
const options = {
  hostname: 'api.figma.com',
  port: 443,
  path: '/v1/me',
  method: 'GET',
  headers: {
    'X-Figma-Token': FIGMA_ACCESS_TOKEN
  }
};

const req = https.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);
  
  res.on('data', (d) => {
    console.log('Response:', d.toString());
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();
