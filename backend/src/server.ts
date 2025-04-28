import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { DataService } from './services/data.service';
import { WebSocketService } from './services/websocket.service';
import { OfflineService } from './services/offline.service';
import { Player } from './types/player';
import { DatabaseService } from './services/database.service';

const app = express();
const server = http.createServer(app);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
}
console.log('Uploads directory:', uploadsDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Add timestamp to ensure unique filenames
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only video files are allowed.`) as any);
    }
  }
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, path) => {
    // Set appropriate headers for video files
    if (path.endsWith('.mp4') || path.endsWith('.mov') || path.endsWith('.avi') || path.endsWith('.webm')) {
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
      // Allow cross-origin access to videos
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
  }
}));

// Initialize services
const databaseService = DatabaseService.getInstance();
const dataService = DataService.getInstance();
const offlineService = OfflineService.getInstance();

// Connect to database
databaseService.connect().then(() => {
  // Initialize WebSocket service after database connection
  new WebSocketService(server);
}).catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

// Routes
app.post('/api/players', async (req, res) => {
  try {
    const requiredFields = ['name', 'age', 'rank', 'country', 'grandSlams', 'hand', 'height'];
    const missingFields = requiredFields.filter(field => !(field in req.body));
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    const player = await dataService.createPlayer(req.body);
    res.status(201).json(player);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/players', async (req, res) => {
  try {
    const { cursor, limit, sortBy, sortOrder, filters: filtersStr, infinite } = req.query;
    
    // Parse filters if they exist
    const filters = filtersStr ? JSON.parse(filtersStr as string) : undefined;
    
    const players = await dataService.getAllPlayers(filters);
    
    // Apply sorting if specified
    if (sortBy) {
      const sortField = sortBy as keyof Player;
      const order = sortOrder === 'desc' ? -1 : 1;
      players.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue.localeCompare(bValue) * order;
        }
        return ((aValue as number) - (bValue as number)) * order;
      });
    }

    // Apply pagination
    const cursorNum = cursor ? parseInt(cursor as string) : 0;
    const limitNum = limit ? parseInt(limit as string) : 20;
    const paginatedPlayers = players.slice(cursorNum, cursorNum + limitNum);
    const hasMore = cursorNum + limitNum < players.length;
    const nextCursor = hasMore ? cursorNum + limitNum : null;

    res.json({
      players: paginatedPlayers,
      nextCursor,
      hasMore
    });
  } catch (error: any) {
    console.error('Error fetching players:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/players/:id', async (req, res) => {
  try {
    const player = await dataService.getPlayerById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    res.json(player);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/players/:id', async (req, res) => {
  try {
    const player = await dataService.updatePlayer(req.params.id, req.body);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    res.json(player);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/players/:id', async (req, res) => {
  try {
    const success = await dataService.deletePlayer(req.params.id);
    if (!success) {
      return res.status(404).json({ message: 'Player not found' });
    }
    res.json({ message: 'Player deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Enhanced file upload route with proper error handling
app.post('/api/players/:id/upload', (req, res) => {
  console.log('Upload request received for player:', req.params.id);
  
  // Handle file upload with proper error handling
  upload.single('video')(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err.message);
      return res.status(400).json({ message: err.message });
    }
    
    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      const playerId = req.params.id;
      
      // Check if player exists
      const player = await dataService.getPlayerById(playerId);
      if (!player) {
        // Delete the uploaded file if player doesn't exist
        if (req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ message: 'Player not found' });
      }
      
      // Update the player with video information
      const videoInfo = {
        videoUrl: `/uploads/${req.file.filename}`,
        videoSize: req.file.size,
        videoType: req.file.mimetype
      };
      
      await dataService.updatePlayer(playerId, videoInfo);
      
      console.log('Video uploaded successfully:', req.file.filename);
      res.status(200).json({
        message: 'Video uploaded successfully',
        filename: req.file.filename,
        url: `/uploads/${req.file.filename}`,
        size: req.file.size,
        mimeType: req.file.mimetype
      });
    } catch (error: any) {
      console.error('Error processing upload:', error);
      res.status(500).json({ message: error.message || 'Error processing upload' });
    }
  });
});

// Get list of uploaded videos for a player
app.get('/api/players/:id/videos', async (req, res) => {
  try {
    const playerId = req.params.id;
    
    // Check if player exists
    const player = await dataService.getPlayerById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    
    if (!player.videoUrl) {
      return res.json({ videos: [] });
    }
    
    res.json({
      videos: [{
        url: player.videoUrl,
        size: player.videoSize,
        type: player.videoType
      }]
    });
  } catch (error: any) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add endpoint to get upload progress - for potential future implementation
app.get('/api/upload-status/:filename', (req, res) => {
  // This would be implemented with a storage mechanism to track uploads
  // For now, we'll return a placeholder
  res.json({
    filename: req.params.filename,
    status: 'completed'
  });
});

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json(offlineService.getStatus());
});

// Add new endpoint for generating multiple players
app.post('/api/players/generate', async (req, res) => {
  try {
    const { count } = req.body;
    const numPlayers = Math.min(parseInt(count) || 1, 1000); // Limit to 1000 players at a time
    
    const generatedPlayers = [];
    for (let i = 0; i < numPlayers; i++) {
      const player = await dataService.generateNewPlayer();
      generatedPlayers.push(player);
    }
    
    res.status(201).json({
      message: `Successfully generated ${numPlayers} players`,
      players: generatedPlayers
    });
  } catch (error: any) {
    console.error('Error generating players:', error);
    res.status(500).json({ message: error.message });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await databaseService.disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}); 