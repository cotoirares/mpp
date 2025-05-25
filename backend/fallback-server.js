/**
 * This is a fallback server that will be used if the TypeScript build fails
 * It uses minimal dependencies to avoid module resolution issues
 */
const express = require('express');

const app = express();
const PORT = process.env.PORT || 8000;

// Simple CORS middleware to avoid importing cors module
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// Basic routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Tennis App API is running in fallback mode',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'API is running in fallback mode',
    status: 'online'
  });
});

// Auth endpoints
app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      message: 'Email and password are required' 
    });
  }
  
  res.json({ 
    message: 'User registered successfully (fallback mode)',
    user: { 
      email,
      role: 'USER'
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      message: 'Email and password are required' 
    });
  }
  
  res.json({ 
    message: 'Login successful (fallback mode)',
    user: { 
      email,
      role: 'USER'
    },
    token: 'fallback-token-' + Date.now()
  });
});

// Catch all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Endpoint not found in fallback mode',
    path: req.originalUrl
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    message: 'Internal server error in fallback mode'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Fallback server running on port ${PORT}`);
  console.log('This is a minimal fallback server due to build issues');
}); 