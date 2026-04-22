// Figma Design Extractor
const https = require('https');
const fs = require('fs');

// You'll need to replace this with your actual Figma access token
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN || '';

// You'll need to replace this with your actual Figma file key
const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY || '';

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

async function extractFigmaDesign() {
  try {
    if (!FIGMA_ACCESS_TOKEN) {
      throw new Error('Please set FIGMA_ACCESS_TOKEN environment variable');
    }

    if (!FIGMA_FILE_KEY) {
      throw new Error('Please set FIGMA_FILE_KEY environment variable');
    }

    console.log('Extracting design from Figma...');
    
    // Get file information
    const fileInfo = await makeFigmaRequest(`/v1/files/${FIGMA_FILE_KEY}`);
    
    console.log('File name:', fileInfo.name);
    console.log('File ID:', fileInfo.document.id);
    
    // Extract components and styles
    const components = [];
    const styles = [];
    
    function traverseNode(node, path = '') {
      if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
        components.push({
          name: node.name,
          type: node.type,
          id: node.id,
          path: path,
          width: node.absoluteBoundingBox?.width,
          height: node.absoluteBoundingBox?.height
        });
      }
      
      if (node.type === 'FRAME' || node.type === 'GROUP') {
        const currentPath = path ? `${path}/${node.name}` : node.name;
        
        if (node.children) {
          node.children.forEach(child => traverseNode(child, currentPath));
        }
      }
    }
    
    traverseNode(fileInfo.document);
    
    console.log(`\nFound ${components.length} components:`);
    components.forEach((comp, index) => {
      console.log(`${index + 1}. ${comp.name} (${comp.type}) - ${comp.path}`);
    });
    
    // Get styles
    try {
      const styleData = await makeFigmaRequest(`/v1/files/${FIGMA_FILE_KEY}/styles`);
      styles.push(...styleData);
    } catch (error) {
      console.log('Could not fetch styles:', error.message);
    }
    
    console.log(`\nFound ${styles.length} styles:`);
    styles.forEach((style, index) => {
      console.log(`${index + 1}. ${style.name} (${style.style_type})`);
    });
    
    // Save extracted data
    const extractedData = {
      file: {
        name: fileInfo.name,
        id: fileInfo.document.id,
        lastModified: fileInfo.lastModified
      },
      components: components,
      styles: styles
    };
    
    fs.writeFileSync('figma-design-extract.json', JSON.stringify(extractedData, null, 2));
    console.log('\nDesign data saved to figma-design-extract.json');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nTo use this script:');
    console.log('1. Get a Figma access token from https://www.figma.com/developers/api#access-tokens');
    console.log('2. Get your Figma file key from the URL (e.g., figma.com/file/FILE_KEY/FILE_NAME)');
    console.log('3. Set environment variables:');
    console.log('   export FIGMA_ACCESS_TOKEN="your_token_here"');
    console.log('   export FIGMA_FILE_KEY="your_file_key_here"');
    console.log('4. Run: node figma-extractor.js');
  }
}

extractFigmaDesign();
