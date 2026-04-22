# Figma Design Integration Setup Guide

This guide will help you connect your Figma designs to the fashion app and extract design templates.

## Option 1: Figma MCP Server (Recommended)

### Prerequisites
- Claude Code installed
- Figma account with access to the design file

### Setup Steps

1. **Install the Figma Plugin for Claude Code:**
   ```bash
   claude plugin install figma@claude-plugins-official
   ```

2. **Or add the MCP server manually:**
   ```bash
   claude mcp add --scope user --transport http figma https://mcp.figma.com/mcp
   ```

3. **Authenticate with Figma:**
   - Type `/mcp` in Claude Code
   - Select "figma" from the list
   - Click "Authenticate"
   - Click "Allow Access" in the Figma popup

4. **Verify Connection:**
   - Type `/mcp` again to see the connected server status
   - You should see "Authentication successful. Connected to figma"

### Using the Figma MCP Server

Once connected, you can:
- Extract design components from Figma files
- Generate React Native components from Figma designs
- Get design tokens and styles
- Export assets and icons

## Option 2: REST API Integration

### Prerequisites
- Node.js installed
- Figma access token
- Figma file key

### Setup Steps

1. **Get Figma Access Token:**
   - Go to https://www.figma.com/developers/api#access-tokens
   - Click "Get started" and create a new personal access token
   - Copy the token (it will look like "figd_xxxxx...")

2. **Get Figma File Key:**
   - Open your Figma design file
   - Copy the file ID from the URL (e.g., figma.com/file/FILE_KEY/FILE_NAME)
   - The FILE_KEY is the part after "/file/" and before the next "/"

3. **Set Environment Variables:**
   ```bash
   export FIGMA_ACCESS_TOKEN="your_token_here"
   export FIGMA_FILE_KEY="your_file_key_here"
   ```

4. **Run the Design Extractor:**
   ```bash
   node figma-design-extractor.js
   ```

### What the Extractor Does

The extractor will:
- Connect to your Figma file
- Extract all components and frames
- Generate React Native components for each design element
- Create a design system with proper styling
- Export design tokens and colors
- Generate usage examples

## Generated Files

When you run the extractor, it will create:

- `./figma-components/` - Directory with generated React Native components
- `figma-design-summary.json` - Summary of extracted components
- `figma-design-raw.json` - Raw Figma API data
- `DesignSystemExample.tsx` - Example usage of extracted components

## Integration with Fashion App

1. **Copy Generated Components:**
   ```bash
   cp -r figma-components/* /home/shaolin/Doppl/fashion-app/src/components/base/
   ```

2. **Update Imports:**
   - Update your app components to use the new design system
   - Replace hardcoded styles with design tokens

3. **Test Integration:**
   ```bash
   cd /home/shaolin/Doppl/fashion-app
   npm start
   ```

## Design Tokens

The extractor will create design tokens for:
- Colors (primary, secondary, background, text)
- Typography (font sizes, weights, line heights)
- Spacing (margins, padding)
- Border radius and shadows
- Component variants

## Troubleshooting

### Common Issues

1. **"Authentication failed"**
   - Check that your Figma token is valid
   - Ensure the token has the right permissions
   - Verify the file is accessible to your account

2. **"File not found"**
   - Double-check the file key from the URL
   - Ensure the file is not password-protected
   - Verify you have access to the file

3. **"No components found"**
   - Ensure your Figma file has components marked as such
   - Check that components are not inside hidden frames
   - Verify components are properly named

### Debug Mode

Enable debug logging:
```bash
export DEBUG=figma
node figma-design-extractor.js
```

## Next Steps

1. **Set up the Figma connection using either method above**
2. **Extract your design templates**
3. **Integrate the generated components into the fashion app**
4. **Test the app locally**
5. **Iterate on the design system**

## Support

If you encounter issues:
- Check the Figma API documentation: https://www.figma.com/developers/api
- Verify your network connection
- Ensure your Figma account has the right permissions
- Check the generated log files for error details
