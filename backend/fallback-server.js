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

// Ensure the MongoDB URI includes the database name
const getMongoURI = () => {
  let uri = MONGODB_URI;
  // If it's a MongoDB Atlas URI and doesn't have a database name, add 'tennisApp'
  if (uri.includes('mongodb+srv://') && !uri.includes('mongodb.net/tennisApp')) {
    uri = uri.replace('mongodb.net/', 'mongodb.net/tennisApp');
  }
  return uri;
};

// Connect to MongoDB
async function connectToDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI:', getMongoURI().replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Log URI without credentials
    
    const client = new MongoClient(getMongoURI(), {
      retryWrites: true,
      w: 'majority',
      authSource: 'admin', // Explicitly set auth source
      ssl: true,
      tlsAllowInvalidCertificates: false
    });
    
    await client.connect();
    
    // Test the connection
    await client.db().admin().ping();
    
    db = client.db();
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    console.error('Full error:', error);
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

// Players endpoints
app.get('/api/players', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({
        message: 'Database connection not available'
      });
    }

    const { cursor, limit, sortBy, sortOrder, filters } = req.query;
    
    // Parse filters if they exist
    let mongoFilters = {};
    if (filters) {
      try {
        mongoFilters = JSON.parse(filters);
      } catch (e) {
        // Ignore invalid filters
      }
    }
    
    // Get players from database
    const players = await db.collection('players').find(mongoFilters).toArray();
    
    // Transform _id to id for frontend compatibility
    const transformedPlayers = players.map(player => ({
      ...player,
      id: player._id.toString(),
      _id: undefined
    }));
    
    // Apply sorting if specified
    if (sortBy) {
      const order = sortOrder === 'desc' ? -1 : 1;
      transformedPlayers.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue.localeCompare(bValue) * order;
        }
        return ((aValue || 0) - (bValue || 0)) * order;
      });
    }

    // Apply pagination
    const cursorNum = cursor ? parseInt(cursor) : 0;
    const limitNum = limit ? parseInt(limit) : 20;
    const paginatedPlayers = transformedPlayers.slice(cursorNum, cursorNum + limitNum);
    const hasMore = cursorNum + limitNum < transformedPlayers.length;
    const nextCursor = hasMore ? cursorNum + limitNum : null;

    res.json({
      players: paginatedPlayers,
      nextCursor,
      hasMore
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({
      message: 'Internal server error while fetching players'
    });
  }
});

app.get('/api/players/:id', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({
        message: 'Database connection not available'
      });
    }

    const { ObjectId } = require('mongodb');
    const player = await db.collection('players').findOne({ _id: new ObjectId(req.params.id) });
    
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    // Transform _id to id for frontend compatibility
    const transformedPlayer = {
      ...player,
      id: player._id.toString(),
      _id: undefined
    };
    
    res.json(transformedPlayer);
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ message: 'Internal server error while fetching player' });
  }
});

app.post('/api/players', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({
        message: 'Database connection not available'
      });
    }

    const requiredFields = ['name', 'age', 'rank', 'country', 'grandSlams', 'hand', 'height'];
    const missingFields = requiredFields.filter(field => !(field in req.body));
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    const player = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('players').insertOne(player);
    const newPlayer = await db.collection('players').findOne({ _id: result.insertedId });
    
    // Transform _id to id for frontend compatibility
    const transformedPlayer = {
      ...newPlayer,
      id: newPlayer._id.toString(),
      _id: undefined
    };
    
    res.status(201).json(transformedPlayer);
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({ message: 'Internal server error while creating player' });
  }
});

app.put('/api/players/:id', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({
        message: 'Database connection not available'
      });
    }

    const { ObjectId } = require('mongodb');
    await db.collection('players').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...req.body, updatedAt: new Date() } }
    );
    
    const updatedPlayer = await db.collection('players').findOne({ _id: new ObjectId(req.params.id) });
    
    if (!updatedPlayer) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    // Transform _id to id for frontend compatibility
    const transformedPlayer = {
      ...updatedPlayer,
      id: updatedPlayer._id.toString(),
      _id: undefined
    };
    
    res.json(transformedPlayer);
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ message: 'Internal server error while updating player' });
  }
});

app.delete('/api/players/:id', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({
        message: 'Database connection not available'
      });
    }

    const { ObjectId } = require('mongodb');
    const result = await db.collection('players').deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ message: 'Internal server error while deleting player' });
  }
});

// Redirect routes for frontend compatibility (in case API_URL is misconfigured)
app.get('/players', (req, res) => {
  // Redirect to the correct API endpoint
  const queryString = req.url.split('?')[1] || '';
  const redirectUrl = `/api/players${queryString ? '?' + queryString : ''}`;
  res.redirect(301, redirectUrl);
});

app.post('/players', (req, res) => {
  res.redirect(307, '/api/players');
});

app.put('/players/:id', (req, res) => {
  res.redirect(307, `/api/players/${req.params.id}`);
});

app.delete('/players/:id', (req, res) => {
  res.redirect(307, `/api/players/${req.params.id}`);
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