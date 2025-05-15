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
Object.defineProperty(exports, "__esModule", { value: true });
exports.playerController = void 0;
const player_model_1 = require("../models/player.model");
exports.playerController = {
    // Create a new player
    createPlayer(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const player = new player_model_1.Player(req.body);
                yield player.save();
                res.status(201).json(player);
            }
            catch (error) {
                res.status(400).json({ message: error.message });
            }
        });
    },
    // Get all players with filtering, sorting, and pagination
    getPlayers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const skip = (page - 1) * limit;
                // Build filter object
                const filter = {};
                if (req.query.country)
                    filter.country = req.query.country;
                if (req.query.hand)
                    filter.hand = req.query.hand;
                if (req.query.minAge)
                    filter.age = { $gte: parseInt(req.query.minAge) };
                if (req.query.maxAge)
                    filter.age = Object.assign(Object.assign({}, filter.age), { $lte: parseInt(req.query.maxAge) });
                // Build sort object
                let sort = {};
                if (req.query.sortBy) {
                    const sortField = req.query.sortBy;
                    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
                    sort[sortField] = sortOrder;
                }
                const players = yield player_model_1.Player.find(filter)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit);
                const total = yield player_model_1.Player.countDocuments(filter);
                res.json({
                    players,
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total
                });
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
    },
    // Update a player
    updatePlayer(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const updates = req.body;
                const player = yield player_model_1.Player.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
                if (!player) {
                    return res.status(404).json({ message: 'Player not found' });
                }
                res.json(player);
            }
            catch (error) {
                res.status(400).json({ message: error.message });
            }
        });
    },
    // Delete a player
    deletePlayer(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const player = yield player_model_1.Player.findByIdAndDelete(id);
                if (!player) {
                    return res.status(404).json({ message: 'Player not found' });
                }
                res.json({ message: 'Player deleted successfully' });
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
    },
    // Get a single player by ID
    getPlayerById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const player = yield player_model_1.Player.findById(id);
                if (!player) {
                    return res.status(404).json({ message: 'Player not found' });
                }
                res.json(player);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
    }
};
