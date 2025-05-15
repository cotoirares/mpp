import request from 'supertest';
import express from 'express';
import { DataService } from '../services/data.service';
import { Player } from '../types/player';

const app = express();
app.use(express.json());

// Initialize data service
const dataService = DataService.getInstance();

// Set up routes for testing
app.post('/api/players', (req, res) => {
  try {
    const requiredFields = ['name', 'age', 'rank', 'country', 'grandSlams', 'hand', 'height'];
    const missingFields = requiredFields.filter(field => !(field in req.body));
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    const player = dataService.createPlayer(req.body);
    res.status(201).json(player);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/players', (req, res) => {
  try {
    const { page, limit, sortBy, sortOrder, ...filters } = req.query;
    const result = dataService.getAllPlayers({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as keyof Player | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
      filters
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/players/:id', (req, res) => {
  try {
    const player = dataService.updatePlayer(req.params.id, req.body);
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }
    res.json(player);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/players/:id', (req, res) => {
  try {
    const success = dataService.deletePlayer(req.params.id);
    if (!success) {
      return res.status(404).json({ message: 'Player not found' });
    }
    res.json({ message: 'Player deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Test player data
const testPlayer: Omit<Player, 'id'> = {
  name: 'Test Player',
  age: 25,
  rank: 10,
  country: 'Test Country',
  grandSlams: 2,
  hand: 'Right',
  height: 180
};

describe('Player API', () => {
  beforeEach(() => {
    // Clear the data service before each test
    dataService['players'].clear();
  });

  describe('POST /api/players', () => {
    it('should create a new player', async () => {
      const response = await request(app)
        .post('/api/players')
        .send(testPlayer);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(testPlayer.name);
      expect(response.body.age).toBe(testPlayer.age);
      expect(response.body.id).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/players')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/players', () => {
    beforeEach(async () => {
      await dataService.createPlayer(testPlayer);
    });

    it('should get all players', async () => {
      const response = await request(app).get('/api/players');

      expect(response.status).toBe(200);
      expect(response.body.players).toHaveLength(1);
      expect(response.body.players[0].name).toBe(testPlayer.name);
    });

    it('should filter players by country', async () => {
      const response = await request(app)
        .get('/api/players')
        .query({ country: 'Test Country' });

      expect(response.status).toBe(200);
      expect(response.body.players).toHaveLength(1);
    });

    it('should sort players by rank', async () => {
      await dataService.createPlayer({
        ...testPlayer,
        name: 'Second Player',
        rank: 5
      });

      const response = await request(app)
        .get('/api/players')
        .query({ sortBy: 'rank', sortOrder: 'asc' });

      expect(response.status).toBe(200);
      expect(response.body.players).toHaveLength(2);
      expect(response.body.players[0].rank).toBe(5);
    });
  });

  describe('PATCH /api/players/:id', () => {
    let playerId: string;

    beforeEach(async () => {
      const player = await dataService.createPlayer(testPlayer);
      playerId = player.id;
    });

    it('should update a player', async () => {
      const response = await request(app)
        .patch(`/api/players/${playerId}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
    });

    it('should return 404 for non-existent player', async () => {
      const response = await request(app)
        .patch('/api/players/non-existent-id')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/players/:id', () => {
    let playerId: string;

    beforeEach(async () => {
      const player = await dataService.createPlayer(testPlayer);
      playerId = player.id;
    });

    it('should delete a player', async () => {
      const response = await request(app)
        .delete(`/api/players/${playerId}`);

      expect(response.status).toBe(200);
      
      const player = dataService.getPlayer(playerId);
      expect(player).toBeUndefined();
    });

    it('should return 404 for non-existent player', async () => {
      const response = await request(app)
        .delete('/api/players/non-existent-id');

      expect(response.status).toBe(404);
    });
  });
}); 