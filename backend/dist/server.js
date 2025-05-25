"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const express_basic_auth_1 = __importDefault(require("express-basic-auth"));
const data_service_1 = require("./services/data.service");
const offline_service_1 = require("./services/offline.service");
const database_service_1 = require("./services/database.service");
const tournament_service_1 = require("./services/tournament.service");
const match_service_1 = require("./services/match.service");
const stats_service_1 = require("./services/stats.service");
const stats_routes_1 = __importDefault(require("./routes/stats.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Create uploads directory if it doesn't exist
const uploadsDir = path_1.default.join(__dirname, '../uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true, mode: 0o755 });
}
console.log('Uploads directory:', uploadsDir);
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Add timestamp to ensure unique filenames
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Invalid file type: ${file.mimetype}. Only video files are allowed.`));
        }
    }
});
// Middleware
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3100'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static(uploadsDir, {
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
// Simple Admin route with database connection info
app.use('/admin', (0, express_basic_auth_1.default)({
    users: { 'admin': 'password' },
    challenge: true,
    realm: 'Tennis App Admin'
}), (req, res) => {
    const mongodbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tennisApp';
    res.send(`
    <html>
      <head>
        <title>Tennis App Database Admin</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          h1, h2 { color: #2c3e50; }
          .container { max-width: 800px; margin: 0 auto; }
          .box { border: 1px solid #ddd; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
          pre { background: #f8f9fa; padding: 10px; border-radius: 5px; overflow-x: auto; }
          .btn { display: inline-block; background: #3498db; color: white; padding: 10px 15px; 
                text-decoration: none; border-radius: 4px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Tennis App Database Administration</h1>
          
          <div class="box">
            <h2>Database Connection Information</h2>
            <p>Connection URI: <pre>${mongodbUri}</pre></p>
            <p>
              To manage your MongoDB database, use MongoDB Compass or another MongoDB client with the connection string above.
            </p>
            <a href="https://www.mongodb.com/products/compass" target="_blank" class="btn">Download MongoDB Compass</a>
          </div>
          
          <div class="box">
            <h2>API Endpoints</h2>
            <h3>Players</h3>
            <pre>GET    /api/players       - List all players</pre>
            <pre>GET    /api/players/:id   - Get player details</pre>
            <pre>POST   /api/players       - Create a player</pre>
            <pre>PUT    /api/players/:id   - Update a player</pre>
            <pre>DELETE /api/players/:id   - Delete a player</pre>
            
            <h3>Tournaments</h3>
            <pre>GET    /api/tournaments       - List all tournaments</pre>
            <pre>GET    /api/tournaments/:id   - Get tournament details</pre>
            <pre>POST   /api/tournaments       - Create a tournament</pre>
            <pre>PUT    /api/tournaments/:id   - Update a tournament</pre>
            <pre>DELETE /api/tournaments/:id   - Delete a tournament</pre>
            
            <h3>Matches</h3>
            <pre>GET    /api/matches       - List all matches</pre>
            <pre>GET    /api/matches/:id   - Get match details</pre>
            <pre>POST   /api/matches       - Create a match</pre>
            <pre>PUT    /api/matches/:id   - Update a match</pre>
            <pre>DELETE /api/matches/:id   - Delete a match</pre>
          </div>
        </div>
      </body>
    </html>
  `);
});
// Initialize services
const databaseService = database_service_1.DatabaseService.getInstance();
const dataService = data_service_1.DataService.getInstance();
const offlineService = offline_service_1.OfflineService.getInstance();
const tournamentService = tournament_service_1.TournamentService.getInstance();
const matchService = match_service_1.MatchService.getInstance();
const statsService = stats_service_1.StatsService.getInstance();
// Connect to database
databaseService.connect().then(() => {
    // WebSocket service disabled to avoid port conflicts
    console.log('Database connected successfully');
}).catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
});
// Routes
app.post('/api/players', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requiredFields = ['name', 'age', 'rank', 'country', 'grandSlams', 'hand', 'height'];
        const missingFields = requiredFields.filter(field => !(field in req.body));
        if (missingFields.length > 0) {
            return res.status(400).json({
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }
        const player = yield dataService.createPlayer(req.body);
        res.status(201).json(player);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
app.get('/api/players', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cursor, limit, sortBy, sortOrder, filters: filtersStr, infinite } = req.query;
        // Parse filters if they exist
        const filters = filtersStr ? JSON.parse(filtersStr) : undefined;
        const players = yield dataService.getAllPlayers(filters);
        // Apply sorting if specified
        if (sortBy) {
            const sortField = sortBy;
            const order = sortOrder === 'desc' ? -1 : 1;
            players.sort((a, b) => {
                const aValue = a[sortField];
                const bValue = b[sortField];
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return aValue.localeCompare(bValue) * order;
                }
                return (aValue - bValue) * order;
            });
        }
        // Apply pagination
        const cursorNum = cursor ? parseInt(cursor) : 0;
        const limitNum = limit ? parseInt(limit) : 20;
        const paginatedPlayers = players.slice(cursorNum, cursorNum + limitNum);
        const hasMore = cursorNum + limitNum < players.length;
        const nextCursor = hasMore ? cursorNum + limitNum : null;
        res.json({
            players: paginatedPlayers,
            nextCursor,
            hasMore
        });
    }
    catch (error) {
        console.error('Error fetching players:', error);
        res.status(500).json({ message: error.message });
    }
}));
app.get('/api/players/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const player = yield dataService.getPlayerById(req.params.id);
        if (!player) {
            return res.status(404).json({ message: 'Player not found' });
        }
        res.json(player);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
app.put('/api/players/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const player = yield dataService.updatePlayer(req.params.id, req.body);
        if (!player) {
            return res.status(404).json({ message: 'Player not found' });
        }
        res.json(player);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
app.delete('/api/players/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const success = yield dataService.deletePlayer(req.params.id);
        if (!success) {
            return res.status(404).json({ message: 'Player not found' });
        }
        res.json({ message: 'Player deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
// Enhanced file upload route with proper error handling
app.post('/api/players/:id/upload', (req, res) => {
    console.log('Upload request received for player:', req.params.id);
    // Handle file upload with proper error handling
    upload.single('video')(req, res, (err) => __awaiter(void 0, void 0, void 0, function* () {
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
            const player = yield dataService.getPlayerById(playerId);
            if (!player) {
                // Delete the uploaded file if player doesn't exist
                if (req.file.path) {
                    fs_1.default.unlinkSync(req.file.path);
                }
                return res.status(404).json({ message: 'Player not found' });
            }
            // Update the player with video information
            const videoInfo = {
                videoUrl: `/uploads/${req.file.filename}`,
                videoSize: req.file.size,
                videoType: req.file.mimetype
            };
            yield dataService.updatePlayer(playerId, videoInfo);
            console.log('Video uploaded successfully:', req.file.filename);
            res.status(200).json({
                message: 'Video uploaded successfully',
                filename: req.file.filename,
                url: `/uploads/${req.file.filename}`,
                size: req.file.size,
                mimeType: req.file.mimetype
            });
        }
        catch (error) {
            console.error('Error processing upload:', error);
            res.status(500).json({ message: error.message || 'Error processing upload' });
        }
    }));
});
// Get list of uploaded videos for a player
app.get('/api/players/:id/videos', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const playerId = req.params.id;
        // Check if player exists
        const player = yield dataService.getPlayerById(playerId);
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
    }
    catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ message: error.message });
    }
}));
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
app.post('/api/players/generate', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { count } = req.body;
        const numPlayers = Math.min(parseInt(count) || 1, 1000); // Limit to 1000 players at a time
        const generatedPlayers = [];
        for (let i = 0; i < numPlayers; i++) {
            const player = yield dataService.generateNewPlayer();
            generatedPlayers.push(player);
        }
        res.status(201).json({
            message: `Successfully generated ${numPlayers} players`,
            players: generatedPlayers
        });
    }
    catch (error) {
        console.error('Error generating players:', error);
        res.status(500).json({ message: error.message });
    }
}));
// Tournament routes
app.post('/api/tournaments', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requiredFields = ['name', 'location', 'startDate', 'endDate', 'category', 'surface', 'prize'];
        const missingFields = requiredFields.filter(field => !(field in req.body));
        if (missingFields.length > 0) {
            return res.status(400).json({
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }
        const tournament = yield tournamentService.createTournament(req.body);
        res.status(201).json(tournament);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
app.get('/api/tournaments', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, location, category, surface, startDate, endDate, minPrize, maxPrize } = req.query;
        const filters = {};
        if (name)
            filters.name = name;
        if (location)
            filters.location = location;
        if (category)
            filters.category = category;
        if (surface)
            filters.surface = surface;
        if (startDate)
            filters.startDate = new Date(startDate);
        if (endDate)
            filters.endDate = new Date(endDate);
        if (minPrize)
            filters.minPrize = parseInt(minPrize);
        if (maxPrize)
            filters.maxPrize = parseInt(maxPrize);
        const tournaments = yield tournamentService.getAllTournaments(filters);
        res.json(tournaments);
    }
    catch (error) {
        console.error('Error fetching tournaments:', error);
        res.status(500).json({ message: error.message });
    }
}));
app.get('/api/tournaments/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tournament = yield tournamentService.getTournamentById(req.params.id);
        if (!tournament) {
            return res.status(404).json({ message: 'Tournament not found' });
        }
        res.json(tournament);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
app.put('/api/tournaments/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tournament = yield tournamentService.updateTournament(req.params.id, req.body);
        if (!tournament) {
            return res.status(404).json({ message: 'Tournament not found' });
        }
        res.json(tournament);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
app.delete('/api/tournaments/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const success = yield tournamentService.deleteTournament(req.params.id);
        if (!success) {
            return res.status(404).json({ message: 'Tournament not found' });
        }
        res.json({ message: 'Tournament deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
app.post('/api/tournaments/:id/players/:playerId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tournament = yield tournamentService.addPlayerToTournament(req.params.id, req.params.playerId);
        if (!tournament) {
            return res.status(404).json({ message: 'Tournament not found' });
        }
        res.json(tournament);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
app.delete('/api/tournaments/:id/players/:playerId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tournament = yield tournamentService.removePlayerFromTournament(req.params.id, req.params.playerId);
        if (!tournament) {
            return res.status(404).json({ message: 'Tournament not found' });
        }
        res.json(tournament);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
// Match routes
app.post('/api/matches', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requiredFields = ['tournament', 'player1', 'player2', 'round', 'date'];
        const missingFields = requiredFields.filter(field => !(field in req.body));
        if (missingFields.length > 0) {
            return res.status(400).json({
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }
        const match = yield matchService.createMatch(req.body);
        res.status(201).json(match);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
app.get('/api/matches', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tournament, player, round, winner, startDate, endDate, minDuration, maxDuration } = req.query;
        const filters = {};
        if (tournament)
            filters.tournament = tournament;
        if (player)
            filters.player = player;
        if (round)
            filters.round = round;
        if (winner)
            filters.winner = winner;
        if (startDate)
            filters.startDate = new Date(startDate);
        if (endDate)
            filters.endDate = new Date(endDate);
        if (minDuration)
            filters.minDuration = parseInt(minDuration);
        if (maxDuration)
            filters.maxDuration = parseInt(maxDuration);
        const matches = yield matchService.getAllMatches(filters);
        res.json(matches);
    }
    catch (error) {
        console.error('Error fetching matches:', error);
        res.status(500).json({ message: error.message });
    }
}));
app.get('/api/matches/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const match = yield matchService.getMatchById(req.params.id);
        if (!match) {
            return res.status(404).json({ message: 'Match not found' });
        }
        res.json(match);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
app.put('/api/matches/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const match = yield matchService.updateMatch(req.params.id, req.body);
        if (!match) {
            return res.status(404).json({ message: 'Match not found' });
        }
        res.json(match);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
app.delete('/api/matches/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const success = yield matchService.deleteMatch(req.params.id);
        if (!success) {
            return res.status(404).json({ message: 'Match not found' });
        }
        res.json({ message: 'Match deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
app.get('/api/tournaments/:id/matches', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const matches = yield matchService.getMatchesByTournament(req.params.id);
        res.json(matches);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
app.get('/api/players/:id/matches', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const matches = yield matchService.getMatchesByPlayer(req.params.id);
        res.json(matches);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
app.put('/api/matches/:id/score', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { score, winner, duration, stats } = req.body;
        if (!score || !winner || !duration || !stats) {
            return res.status(400).json({
                message: 'Missing required fields: score, winner, duration, or stats'
            });
        }
        const match = yield matchService.updateMatchScore(req.params.id, score, winner, duration, stats);
        if (!match) {
            return res.status(404).json({ message: 'Match not found' });
        }
        res.json(match);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
// Use the auth routes
app.use('/api/auth', auth_routes_1.default);
// Use the stats routes
app.use('/api/stats', stats_routes_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});
// Start server
const PORT = process.env.PORT || 3100;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
// Handle shutdown gracefully
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Shutting down server...');
    yield databaseService.disconnect();
    process.exit(0);
}));
