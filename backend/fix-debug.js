const fs = require('fs');
const path = require('path');

// Find the debug module node.js file
const debugNodePath = path.resolve('./node_modules/debug/src/node.js');

if (fs.existsSync(debugNodePath)) {
  console.log('Patching debug module...');
  
  // Read the file
  let content = fs.readFileSync(debugNodePath, 'utf8');
  
  // Check if it needs to be patched
  if (content.includes('require(\'./common\')')) {
    console.log('Applying patch to debug module');
    
    // Replace the problematic line with a direct import of the common.js file
    content = content.replace(
      'require(\'./common\')',
      'require(\'./common.js\')'
    );
    
    // Write the file back
    fs.writeFileSync(debugNodePath, content, 'utf8');
    console.log('Debug module patched successfully');
  } else {
    console.log('Debug module already patched or different version');
  }
} else {
  console.log('Debug module not found at expected path');
} 