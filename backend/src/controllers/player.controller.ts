import { Request, Response } from 'express';
import { Player } from '../models/player.model';

export const playerController = {
  // Create a new player
  async createPlayer(req: Request, res: Response) {
    try {
      const player = new Player(req.body);
      await player.save();
      res.status(201).json(player);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  // Get all players with filtering, sorting, and pagination
  async getPlayers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Build filter object
      const filter: any = {};
      if (req.query.country) filter.country = req.query.country;
      if (req.query.hand) filter.hand = req.query.hand;
      if (req.query.minAge) filter.age = { $gte: parseInt(req.query.minAge as string) };
      if (req.query.maxAge) filter.age = { ...filter.age, $lte: parseInt(req.query.maxAge as string) };

      // Build sort object
      let sort: any = {};
      if (req.query.sortBy) {
        const sortField = req.query.sortBy as string;
        const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
        sort[sortField] = sortOrder;
      }

      const players = await Player.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const total = await Player.countDocuments(filter);

      res.json({
        players,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  // Update a player
  async updatePlayer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const player = await Player.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );

      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }

      res.json(player);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  // Delete a player
  async deletePlayer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const player = await Player.findByIdAndDelete(id);

      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }

      res.json({ message: 'Player deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get a single player by ID
  async getPlayerById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const player = await Player.findById(id);

      if (!player) {
        return res.status(404).json({ message: 'Player not found' });
      }

      res.json(player);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}; 