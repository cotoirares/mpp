/**
 * Simple start script that runs the fallback server
 * This avoids any module resolution issues
 */

console.log('Starting Tennis App Backend...');

try {
  // Try to run the fallback server directly
  require('./fallback-server.js');
} catch (error) {
  console.error('Failed to start fallback server:', error.message);
  
  // If even the fallback fails, create a minimal HTTP server
  const http = require('http');
  
  const server = http.createServer((req, res) => {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    
    if (req.method === 'OPTIONS') {
      res.end();
      return;
    }
    
    const response = {
      message: 'Minimal HTTP server running',
      status: 'online',
      timestamp: new Date().toISOString()
    };
    
    res.end(JSON.stringify(response));
  });
  
  const PORT = process.env.PORT || 8000;
  server.listen(PORT, () => {
    console.log(`Minimal HTTP server running on port ${PORT}`);
  });
} 