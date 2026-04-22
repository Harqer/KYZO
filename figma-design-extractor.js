#!/usr/bin/env node

/**
 * Figma Design Template Extractor
 * 
 * This script extracts design templates from Figma and converts them to React Native components
 * 
 * Usage:
 * 1. Get a Figma access token from https://www.figma.com/developers/api#access-tokens
 * 2. Get your Figma file key from the URL (e.g., figma.com/file/FILE_KEY/FILE_NAME)
 * 3. Set environment variables:
 *    export FIGMA_ACCESS_TOKEN="your_token_here"
 *    export FIGMA_FILE_KEY="your_file_key_here"
 * 4. Run: node figma-design-extractor.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN || '';
const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY || '';

// Colors and styles mapping
const colorMap = {
  '#000000': '#000000',
  '#FFFFFF': '#FFFFFF',
  '#6366F1': '#6366F1',
  '#1F2937': '#1F2937',
  '#F3F4F6': '#F3F4F6',
  '#E5E7EB': '#E5E7EB',
  '#9CA3AF': '#9CA3AF',
  '#6B7280': '#6B7280',
  '#EF4444': '#EF4444',
  '#10B981': '#10B981',
  '#F59E0B': '#F59E0B'
};

function makeFigmaRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.figma.com',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'X-Figma-Token': FIGMA_ACCESS_TOKEN
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

function extractColorFromFill(fill) {
  if (fill && fill.type === 'SOLID' && fill.color) {
    const { r, g, b } = fill.color;
    return `#${Math.round(r * 255).toString(16).padStart(2, '0')}${Math.round(g * 255).toString(16).padStart(2, '0')}${Math.round(b * 255).toString(16).padStart(2, '0')}`.toUpperCase();
  }
  return null;
}

function generateReactNativeComponent(node, componentName) {
  const props = [];
  const styles = {};
  const children = [];
  
  // Extract properties
  if (node.name) {
    props.push(`title="${node.name}"`);
  }
  
  // Extract styles
  if (node.absoluteBoundingBox) {
    styles.width = node.absoluteBoundingBox.width;
    styles.height = node.absoluteBoundingBox.height;
  }
  
  if (node.fills && node.fills.length > 0) {
    const backgroundColor = extractColorFromFill(node.fills[0]);
    if (backgroundColor) {
      styles.backgroundColor = backgroundColor;
    }
  }
  
  if (node.strokes && node.strokes.length > 0) {
    const borderColor = extractColorFromFill(node.strokes[0]);
    if (borderColor) {
      styles.borderColor = borderColor;
    }
    if (node.strokeWeight) {
      styles.borderWidth = node.strokeWeight;
    }
  }
  
  if (node.cornerRadius) {
    styles.borderRadius = node.cornerRadius;
  }
  
  // Generate component code
  let componentCode = `import React from 'react';\n`;
  componentCode += `import { View, Text, StyleSheet } from 'react-native';\n\n`;
  
  componentCode += `interface ${componentName}Props {\n`;
  if (props.length > 0) {
    componentCode += `  ${props.join(',\n  ')};\n`;
  }
  componentCode += `}\n\n`;
  
  componentCode += `export const ${componentName}: React.FC<${componentName}Props> = ({`;
  if (props.length > 0) {
    componentCode += `\n  ${props.map(prop => prop.split('=')[0]).join(',\n  ')}\n`;
  }
  componentCode += `}) => {\n`;
  componentCode += `  return (\n`;
  componentCode += `    <View style={styles.container}>\n`;
  
  if (node.name) {
    componentCode += `      <Text style={styles.title}>${node.name}</Text>\n`;
  }
  
  componentCode += `    </View>\n`;
  componentCode += `  );\n`;
  componentCode += `};\n\n`;
  
  componentCode += `const styles = StyleSheet.create({\n`;
  componentCode += `  container: {\n`;
  
  Object.entries(styles).forEach(([key, value]) => {
    componentCode += `    ${key}: ${typeof value === 'number' ? value : `'${value}'`},\n`;
  });
  
  componentCode += `  },\n`;
  
  if (node.name) {
    componentCode += `  title: {\n`;
    componentCode += `    fontSize: 16,\n`;
    componentCode += `    fontWeight: 'bold',\n`;
    componentCode += `    color: '#1F2937',\n`;
    componentCode += `  },\n`;
  }
  
  componentCode += `});\n`;
  
  return componentCode;
}

async function extractFigmaDesign() {
  try {
    if (!FIGMA_ACCESS_TOKEN) {
      throw new Error('Please set FIGMA_ACCESS_TOKEN environment variable');
    }

    if (!FIGMA_FILE_KEY) {
      throw new Error('Please set FIGMA_FILE_KEY environment variable');
    }

    console.log('Extracting design from Figma...');
    console.log(`File Key: ${FIGMA_FILE_KEY}`);
    
    // Get file information
    const fileInfo = await makeFigmaRequest(`/v1/files/${FIGMA_FILE_KEY}`);
    
    console.log('File name:', fileInfo.name);
    console.log('File ID:', fileInfo.document.id);
    
    // Create output directory
    const outputDir = './figma-components';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Extract components and generate React Native components
    const components = [];
    const componentCounter = {};
    
    function traverseNode(node, path = '') {
      if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
        const componentName = node.name.replace(/[^a-zA-Z0-9]/g, '');
        const uniqueName = componentCounter[componentName] 
          ? `${componentName}${componentCounter[componentName]}` 
          : componentName;
        
        componentCounter[componentName] = (componentCounter[componentName] || 0) + 1;
        
        components.push({
          name: uniqueName,
          type: node.type,
          id: node.id,
          path: path,
          node: node
        });
        
        // Generate React Native component
        const componentCode = generateReactNativeComponent(node, uniqueName);
        const filePath = path.join(outputDir, `${uniqueName}.tsx`);
        fs.writeFileSync(filePath, componentCode);
        console.log(`Generated component: ${filePath}`);
      }
      
      if (node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'INSTANCE') {
        const currentPath = path ? `${path}/${node.name}` : node.name;
        
        if (node.children) {
          node.children.forEach(child => traverseNode(child, currentPath));
        }
      }
    }
    
    traverseNode(fileInfo.document);
    
    // Generate summary
    const summary = {
      file: {
        name: fileInfo.name,
        id: fileInfo.document.id,
        lastModified: fileInfo.lastModified
      },
      components: components.map(comp => ({
        name: comp.name,
        type: comp.type,
        id: comp.id,
        path: comp.path
      })),
      extractedAt: new Date().toISOString()
    };
    
    fs.writeFileSync('figma-design-summary.json', JSON.stringify(summary, null, 2));
    fs.writeFileSync('figma-design-raw.json', JSON.stringify(fileInfo, null, 2));
    
    console.log(`\nExtraction complete!`);
    console.log(`- Generated ${components.length} React Native components`);
    console.log(`- Components saved to: ${outputDir}/`);
    console.log(`- Summary saved to: figma-design-summary.json`);
    console.log(`- Raw data saved to: figma-design-raw.json`);
    
    // Generate usage example
    const usageExample = `// Example usage of extracted components
import React from 'react';
import { View, StyleSheet } from 'react-native';

${components.slice(0, 3).map(comp => 
  `import { ${comp.name} } from './figma-components/${comp.name}';`
).join('\n')}

export const DesignSystemExample = () => {
  return (
    <View style={styles.container}>
${components.slice(0, 3).map(comp => 
      `      <${comp.name} />`
).join('\n')}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F3F4F6',
  },
});
`;

    fs.writeFileSync('DesignSystemExample.tsx', usageExample);
    console.log(`- Usage example saved to: DesignSystemExample.tsx`);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\n=== Setup Instructions ===');
    console.log('1. Get a Figma access token from https://www.figma.com/developers/api#access-tokens');
    console.log('2. Get your Figma file key from the URL (e.g., figma.com/file/FILE_KEY/FILE_NAME)');
    console.log('3. Set environment variables:');
    console.log('   export FIGMA_ACCESS_TOKEN="your_token_here"');
    console.log('4. Run: node figma-design-extractor.js');
    process.exit(1);
  }
}

// Run the extractor
if (require.main === module) {
  extractFigmaDesign();
}

module.exports = { extractFigmaDesign, makeFigmaRequest };
