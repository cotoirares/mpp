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
  const url = require('url');
  
  const server = http.createServer((req, res) => {
    // Parse URL and method
    const parsedUrl = url.parse(req.url, true);
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
    
    // Handle POST requests with body parsing
    if (method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        let requestData = {};
        try {
          requestData = JSON.parse(body);
        } catch (e) {
          requestData = {};
        }
        
        // Handle auth endpoints
        if (path === '/api/auth/register') {
          const { email, password } = requestData;
          
          if (!email || !password) {
            res.writeHead(400);
            res.end(JSON.stringify({ 
              message: 'Email and password are required' 
            }));
            return;
          }
          
          res.writeHead(200);
          res.end(JSON.stringify({ 
            message: 'User registered successfully (minimal mode)',
            user: { 
              email,
              role: 'USER'
            }
          }));
          return;
        }
        
        if (path === '/api/auth/login') {
          const { email, password } = requestData;
          
          if (!email || !password) {
            res.writeHead(400);
            res.end(JSON.stringify({ 
              message: 'Email and password are required' 
            }));
            return;
          }
          
          res.writeHead(200);
          res.end(JSON.stringify({ 
            message: 'Login successful (minimal mode)',
            user: { 
              email,
              role: 'USER'
            },
            token: 'minimal-token-' + Date.now()
          }));
          return;
        }
        
        // Default response for other POST requests
        res.writeHead(404);
        res.end(JSON.stringify({
          message: 'Endpoint not found',
          path: path
        }));
      });
      
      return;
    }
    
    // Handle GET requests
    if (method === 'GET') {
      if (path === '/' || path === '/api/status') {
        res.writeHead(200);
        res.end(JSON.stringify({
          message: 'Minimal HTTP server running',
          status: 'online',
          timestamp: new Date().toISOString()
        }));
        return;
      }
    }
    
    // Default 404 response
    res.writeHead(404);
    res.end(JSON.stringify({
      message: 'Endpoint not found',
      path: path,
      method: method
    }));
  });
  
  const PORT = process.env.PORT || 8000;
  server.listen(PORT, () => {
    console.log(`Minimal HTTP server running on port ${PORT}`);
    console.log('Handling auth endpoints: /api/auth/login, /api/auth/register');
  });
} 