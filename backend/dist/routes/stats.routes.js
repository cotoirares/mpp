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
const stats_service_1 = require("../services/stats.service");
const router = express_1.default.Router();
const statsService = stats_service_1.StatsService.getInstance();
// Get player win percentages by surface type (optimized for large dataset)
router.get('/player-win-percentages', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const minMatches = req.query.minMatches ? parseInt(req.query.minMatches) : 5;
        const startTime = Date.now();
        const result = yield statsService.getPlayerWinPercentagesBySurface(limit, minMatches);
        const endTime = Date.now();
        res.json({
            stats: result,
            executionTimeMs: endTime - startTime,
            count: result.length
        });
    }
    catch (error) {
        console.error('Error getting player win percentages:', error);
        res.status(500).json({ error: 'Failed to get player win percentages' });
    }
}));
// Get match duration statistics by tournament surface
router.get('/match-duration-by-surface', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const startTime = Date.now();
        const result = yield statsService.getMatchDurationStatsBySurface();
        const endTime = Date.now();
        res.json({
            stats: result,
            executionTimeMs: endTime - startTime
        });
    }
    catch (error) {
        console.error('Error getting match duration stats:', error);
        res.status(500).json({ error: 'Failed to get match duration statistics' });
    }
}));
// Get aggregated player performance statistics
router.get('/player-performance', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        const minMatches = req.query.minMatches ? parseInt(req.query.minMatches) : 10;
        const startTime = Date.now();
        const result = yield statsService.getPlayerPerformanceStats(limit, minMatches);
        const endTime = Date.now();
        res.json({
            stats: result,
            executionTimeMs: endTime - startTime,
            count: result.length
        });
    }
    catch (error) {
        console.error('Error getting player performance stats:', error);
        res.status(500).json({ error: 'Failed to get player performance statistics' });
    }
}));
// Get top tournament statistics by player count and match count
router.get('/tournament-stats', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const startTime = Date.now();
        const result = yield statsService.getTournamentStatistics(limit);
        const endTime = Date.now();
        res.json({
            stats: result,
            executionTimeMs: endTime - startTime,
            count: result.length
        });
    }
    catch (error) {
        console.error('Error getting tournament statistics:', error);
        res.status(500).json({ error: 'Failed to get tournament statistics' });
    }
}));
// Get match count by year and surface
router.get('/matches-by-year-surface', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const startTime = Date.now();
        const result = yield statsService.getMatchesByYearAndSurface();
        const endTime = Date.now();
        res.json({
            stats: result,
            executionTimeMs: endTime - startTime
        });
    }
    catch (error) {
        console.error('Error getting matches by year and surface:', error);
        res.status(500).json({ error: 'Failed to get matches by year and surface' });
    }
}));
exports.default = router;
