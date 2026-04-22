# Figma MCP Server Setup for Windsurf/Cascade

Based on the official documentation from both Figma and Windsurf, here's how to properly set up the Figma MCP server for design extraction.

## Step 1: Create MCP Configuration File

Create the MCP configuration file at `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "figma": {
      "serverUrl": "https://mcp.figma.com/mcp",
      "headers": {
        "Authorization": "Bearer ${env:FIGMA_ACCESS_TOKEN}"
      }
    }
  }
}
```

## Step 2: Set Up Figma Access Token

1. **Get Figma Access Token:**
   - Go to https://www.figma.com/developers/api#access-tokens
   - Click "Get started" and create a new personal access token
   - Copy the token (it will look like "figd_xxxxx...")

2. **Set Environment Variable:**
   ```bash
   export FIGMA_ACCESS_TOKEN="your_token_here"
   ```

   Or add it to your shell profile (~/.bashrc, ~/.zshrc):
   ```bash
   echo 'export FIGMA_ACCESS_TOKEN="your_token_here"' >> ~/.bashrc
   source ~/.bashrc
   ```

## Step 3: Install Configuration

Create the Windsurf MCP directory and copy the configuration:

```bash
mkdir -p ~/.codeium/windsurf
cp /home/shaolin/mcp_config.json ~/.codeium/windsurf/mcp_config.json
```

## Step 4: Restart Windsurf

After setting up the configuration, restart Windsurf/Cascade to load the new MCP server.

## Step 5: Verify Connection

1. Open the Cascade panel in Windsurf
2. Click on the "MCPs" icon in the top right menu
3. You should see "figma" listed as an available server
4. Click on "figma" to see the available tools

## Step 6: Authenticate (if needed)

If the server requires OAuth authentication:

1. In the MCP settings for figma, click "Authenticate"
2. This will open a Figma authentication window
3. Click "Allow Access" to grant permission
4. You should see "Authentication successful"

## Available Figma MCP Tools

Once connected, you'll have access to tools like:

- **Get design context** - Extract design information from Figma files
- **Send UI to Figma** - Send React components back to Figma
- **Export components** - Extract design components as code
- **Get styles** - Extract design tokens and styles

## Usage Examples

### Extract Design Templates

Once connected, you can ask Cascade to:

1. "Extract the design system from my Figma file"
2. "Convert this Figma component to React Native"
3. "Get the color palette and typography from my design"
4. "Export all components from this Figma file as TypeScript"

### Get File Information

You'll need your Figma file key from the URL:
- URL: `https://www.figma.com/file/FILE_KEY/FILE_NAME`
- The FILE_KEY is the part after `/file/` and before the next `/`

## Troubleshooting

### Common Issues

1. **"Server not found" error:**
   - Check that the configuration file is in the correct location
   - Verify the URL is exactly `https://mcp.figma.com/mcp`
   - Restart Windsurf/Cascade

2. **"Authentication failed" error:**
   - Verify your FIGMA_ACCESS_TOKEN is valid
   - Check that the token has the right permissions
   - Ensure the environment variable is set correctly

3. **"No tools available" error:**
   - Check that the server is properly authenticated
   - Verify you have access to the Figma file
   - Ensure the file key is correct

### Debug Mode

Enable debug logging to troubleshoot issues:

```bash
export DEBUG=figma,mcp
```

## Alternative: Manual REST API

If MCP setup doesn't work, you can use the REST API approach:

```bash
# Set environment variables
export FIGMA_ACCESS_TOKEN="your_token_here"
export FIGMA_FILE_KEY="your_file_key_here"

# Run the extractor
node figma-design-extractor.js
```

## Next Steps

1. Set up the MCP configuration following the steps above
2. Test the connection with a simple Figma file
3. Extract design templates and integrate them into your fashion app
4. Use the extracted components to enhance your ecommerce design
