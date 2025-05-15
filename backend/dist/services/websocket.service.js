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
exports.WebSocketService = void 0;
const ws_1 = __importDefault(require("ws"));
const data_service_1 = require("./data.service");
class WebSocketService {
    constructor(server) {
        this.clients = new Set();
        this.generationInterval = null;
        this.generationRate = 5000; // Generate new player every 5 seconds
        // Initialize WebSocket server with proper configuration
        this.wss = new ws_1.default.Server({
            server,
            // Add permissive settings for development
            verifyClient: (info, cb) => {
                // In production, you would want to verify the origin
                // For development, we'll accept all connections
                cb(true);
            }
        });
        this.dataService = data_service_1.DataService.getInstance();
        console.log('WebSocket server initialized');
        this.setupWebSocket();
        this.startDataGeneration();
    }
    setupWebSocket() {
        this.wss.on('connection', (ws, req) => __awaiter(this, void 0, void 0, function* () {
            const extendedWs = ws;
            const clientIp = req.socket.remoteAddress;
            console.log(`New WebSocket client connected from ${clientIp}`);
            this.clients.add(extendedWs);
            // Set up ping-pong to detect dead connections
            extendedWs.isAlive = true;
            extendedWs.on('pong', () => {
                extendedWs.isAlive = true;
            });
            try {
                // Send initial data
                const players = yield this.dataService.getAllPlayers({});
                const stats = yield this.dataService.getStatistics();
                const initialData = {
                    type: 'initial',
                    data: {
                        players: players.slice(0, 20), // Just send first 20 players for initial load
                        stats
                    }
                };
                // Only send if the connection is still open
                if (extendedWs.readyState === ws_1.default.OPEN) {
                    extendedWs.send(JSON.stringify(initialData));
                    console.log('Initial data sent to client');
                }
            }
            catch (error) {
                console.error('Error sending initial data:', error);
            }
            // Handle messages from client
            extendedWs.on('message', (message) => __awaiter(this, void 0, void 0, function* () {
                try {
                    console.log('Received message from client:', message.toString().substring(0, 100));
                    const data = JSON.parse(message.toString());
                    // Handle commands from client
                    if (data.type === 'command') {
                        switch (data.command) {
                            case 'changeGenerationRate':
                                this.setGenerationRate(data.value);
                                console.log(`Changed generation rate to ${data.value}ms`);
                                break;
                            case 'generatePlayers':
                                const count = data.count || 1;
                                console.log(`Generating ${count} players on demand`);
                                yield this.generateMultiplePlayers(count);
                                break;
                        }
                    }
                }
                catch (error) {
                    console.error('Error processing client message:', error);
                }
            }));
            extendedWs.on('close', (code, reason) => {
                console.log(`WebSocket client disconnected. Code: ${code}, Reason: ${reason || 'No reason provided'}`);
                this.clients.delete(extendedWs);
            });
            extendedWs.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.clients.delete(extendedWs);
            });
        }));
        // Set up interval to check for dead connections
        const interval = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                const extendedWs = ws;
                if (extendedWs.isAlive === false) {
                    return extendedWs.terminate();
                }
                extendedWs.isAlive = false;
                extendedWs.ping(() => { });
            });
        }, 30000);
        this.wss.on('close', () => {
            clearInterval(interval);
        });
    }
    generateMultiplePlayers(count) {
        return __awaiter(this, void 0, void 0, function* () {
            const max = Math.min(count, 10); // Limit to 10 players at once
            const newPlayers = [];
            for (let i = 0; i < max; i++) {
                try {
                    const player = yield this.dataService.generateNewPlayer();
                    newPlayers.push(player);
                }
                catch (error) {
                    console.error('Error generating player:', error);
                }
            }
            if (newPlayers.length > 0) {
                const stats = yield this.dataService.getStatistics();
                this.broadcast({
                    type: 'bulkUpdate',
                    data: {
                        newPlayers,
                        stats
                    }
                });
                console.log(`Generated and broadcast ${newPlayers.length} new players`);
            }
        });
    }
    setGenerationRate(milliseconds) {
        // Validate input (minimum 1 second, maximum 1 minute)
        const rate = Math.max(1000, Math.min(60000, milliseconds));
        this.generationRate = rate;
        // Restart generation with new rate
        if (this.generationInterval) {
            clearInterval(this.generationInterval);
        }
        this.startDataGeneration();
        // Inform all clients of the rate change
        this.broadcast({
            type: 'rateChanged',
            data: {
                generationRate: this.generationRate
            }
        });
    }
    startDataGeneration() {
        // Clear existing interval if any
        if (this.generationInterval) {
            clearInterval(this.generationInterval);
        }
        console.log(`Starting player generation at rate of ${this.generationRate}ms`);
        this.generationInterval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.clients.size === 0) {
                    return; // No clients connected, skip generation
                }
                // Generate a new player
                const newPlayer = yield this.dataService.generateNewPlayer();
                console.log(`Generated new player: ${newPlayer.name}`);
                // Get updated stats
                const stats = yield this.dataService.getStatistics();
                // Broadcast to all connected clients
                this.broadcast({
                    type: 'update',
                    data: {
                        newPlayer,
                        stats
                    }
                });
            }
            catch (error) {
                console.error('Error generating data:', error);
            }
        }), this.generationRate);
    }
    broadcast(message) {
        if (this.clients.size === 0) {
            return; // No clients to broadcast to
        }
        const data = JSON.stringify(message);
        let successCount = 0;
        let failCount = 0;
        this.clients.forEach(client => {
            try {
                if (client.readyState === ws_1.default.OPEN) {
                    client.send(data);
                    successCount++;
                }
                else {
                    // Client not ready, might be closing or connecting
                    failCount++;
                }
            }
            catch (error) {
                console.error('Error sending message to client:', error);
                failCount++;
            }
        });
        console.log(`Broadcast stats: ${successCount} successful, ${failCount} failed`);
    }
}
exports.WebSocketService = WebSocketService;
