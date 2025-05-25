/**
 * This is a fallback server that will be used if the TypeScript build fails
 * It uses minimal dependencies and connects to MongoDB for real authentication
 */
const express = require('express');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 8000;

// MongoDB connection
let db = null;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tennisApp';
const JWT_SECRET = process.env.JWT_SECRET || 'tennis123';

// Connect to MongoDB
async function connectToDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db();
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    // Continue without database - will return errors for auth operations
  }
}

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
    message: 'Tennis App API is running in fallback mode with MongoDB',
    status: 'online',
    database: db ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'API is running in fallback mode with MongoDB',
    status: 'online',
    database: db ? 'connected' : 'disconnected'
  });
});

// Auth endpoints with real MongoDB integration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, role = 'USER' } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    if (!db) {
      return res.status(500).json({
        message: 'Database connection not available'
      });
    }

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      email,
      password: hashedPassword,
      role,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('users').insertOne(user);
    
    res.status(201).json({ 
      message: 'User registered successfully',
      user: { 
        id: result.insertedId.toString(),
        email,
        role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Internal server error during registration'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    if (!db) {
      return res.status(500).json({
        message: 'Database connection not available'
      });
    }

    // Find user
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      message: 'Login successful',
      user: { 
        id: user._id.toString(),
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Internal server error during login'
    });
  }
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
async function startServer() {
  await connectToDatabase();
  
  app.listen(PORT, () => {
    console.log(`Fallback server with MongoDB running on port ${PORT}`);
    console.log('Database status:', db ? 'connected' : 'disconnected');
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 