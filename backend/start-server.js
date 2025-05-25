/**
 * Start script that uses the fallback server directly
 */

console.log('Starting Tennis App Backend in fallback mode...');

// Use the fallback server directly since it has all the endpoints we need
try {
  console.log('Starting fallback Express server with MongoDB...');
  require('./fallback-server.js');
} catch (error) {
  console.error('Failed to start fallback server:', error instanceof Error ? error.message : String(error));
  console.log('Starting minimal HTTP server as last resort...');
  
  // If even the fallback fails, create a minimal HTTP server
  const http = require('http');
  const url = require('url');
  
  const server = http.createServer((req, res) => {
    // Parse URL and method
    const parsedUrl = url.parse(req.url || '', true);
    const path = parsedUrl.pathname;
    const method = req.method;
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');
    
    // Handle OPTIONS requests
    if (method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    // Handle GET requests
    if (method === 'GET') {
      if (path === '/' || path === '/api/status') {
        res.writeHead(200);
        res.end(JSON.stringify({
          message: 'Minimal HTTP server running - fallback failed',
          status: 'online',
          timestamp: new Date().toISOString()
        }));
        return;
      }
      
      if (path === '/api/players') {
        res.writeHead(200);
        res.end(JSON.stringify({
          players: [],
          nextCursor: null,
          hasMore: false,
          message: 'Fallback server failed - no database connection'
        }));
        return;
      }
    }
    
    // Default 404 response
    res.writeHead(404);
    res.end(JSON.stringify({
      message: 'Endpoint not found in minimal mode',
      path: path,
      method: method
    }));
  });
  
  const PORT = process.env.PORT || 8000;
  server.listen(PORT, () => {
    console.log(`Minimal HTTP server running on port ${PORT}`);
    console.log('Fallback server failed to start');
  });
} 