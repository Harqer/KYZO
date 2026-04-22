#!/bin/bash

echo "=== Figma Design Extraction Setup ==="
echo ""
echo "This script will help you set up Figma access for design extraction."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "Node.js is installed: $(node --version)"

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    echo "Error: curl is not installed. Please install curl first."
    exit 1
fi

echo "curl is installed: $(curl --version | head -n 1)"

echo ""
echo "=== Figma API Setup Instructions ==="
echo ""
echo "1. Get a Figma access token:"
echo "   - Go to https://www.figma.com/developers/api#access-tokens"
echo "   - Click 'Get started' and create a new personal access token"
echo "   - Copy the token (it will look like 'figd_xxxxx...')"
echo ""
echo "2. Get your Figma file key:"
echo "   - Open your Figma design file"
echo "   - Copy the file ID from the URL (e.g., figma.com/file/FILE_KEY/FILE_NAME)"
echo "   - The FILE_KEY is the part after '/file/' and before the next '/'"
echo ""
echo "3. Set environment variables:"
echo "   export FIGMA_ACCESS_TOKEN=\"your_token_here\""
echo "   export FIGMA_FILE_KEY=\"your_file_key_here\""
echo ""
echo "4. Test the connection:"
echo "   node figma-extractor.js"
echo ""
echo "=== Alternative: MCP Server Setup ==="
echo ""
echo "If you want to use the Figma MCP server (recommended):"
echo ""
echo "1. Install the Figma plugin for Claude Code:"
echo "   claude plugin install figma@claude-plugins-official"
echo ""
echo "2. Or add the MCP server manually:"
echo "   claude mcp add --scope user --transport http figma https://mcp.figma.com/mcp"
echo ""
echo "3. Then authenticate with /mcp command in Claude Code"
echo ""

# Ask if user wants to test with sample data
read -p "Do you want to test with a sample Figma file? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Testing Figma API connectivity..."
    
    # Test with a public file (this will work without authentication for public files)
    echo "Testing with a sample public Figma file..."
    
    # Create a simple test script
    cat > test-figma-public.js << 'EOF'
const https = require('https');

const options = {
  hostname: 'api.figma.com',
  port: 443,
  path: '/v1/files/ExQqyK5fT0cWkS9y4vD2rL', // Sample public file
  method: 'GET'
};

const req = https.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);
  
  res.on('data', (d) => {
    if (res.statusCode === 200) {
      const data = JSON.parse(d.toString());
      console.log('Success! Connected to Figma API');
      console.log('Sample file name:', data.name);
      console.log('You can now use your own file with the access token');
    } else {
      console.log('Response:', d.toString());
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();
EOF

    node test-figma-public.js
    rm test-figma-public.js
fi

echo ""
echo "=== Next Steps ==="
echo ""
echo "Once you have your Figma access token and file key:"
echo "1. Set the environment variables"
echo "2. Run 'node figma-extractor.js' to extract design components"
echo "3. The extracted data will be saved to 'figma-design-extract.json'"
echo "4. You can then use this data to generate React Native components"
echo ""
