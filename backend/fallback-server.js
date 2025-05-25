/**
 * This is a fallback server that will be used if the TypeScript build fails
 */
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS
app.use(cors({
  origin: ['http://localhost:3000', 'https://mpp-nine-smoky.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Basic routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Tennis App API is running in fallback mode',
    status: 'online'
  });
});

// Auth endpoints
app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body;
  res.json({ 
    message: 'User registered successfully (fallback mode)',
    user: { email }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  res.json({ 
    message: 'Login successful (fallback mode)',
    user: { 
      email,
      role: 'USER'
    },
    token: 'fallback-token'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Fallback server running on port ${PORT}`);
}); 