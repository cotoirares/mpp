import express from 'express';
import { StatsService } from '../services/stats.service';

const router = express.Router();
const statsService = StatsService.getInstance();

// Get player win percentages by surface type (optimized for large dataset)
router.get('/player-win-percentages', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const minMatches = req.query.minMatches ? parseInt(req.query.minMatches as string) : 5;

    const startTime = Date.now();
    const result = await statsService.getPlayerWinPercentagesBySurface(limit, minMatches);
    const endTime = Date.now();

    res.json({
      stats: result,
      executionTimeMs: endTime - startTime,
      count: result.length
    });
  } catch (error) {
    console.error('Error getting player win percentages:', error);
    res.status(500).json({ error: 'Failed to get player win percentages' });
  }
});

// Get match duration statistics by tournament surface
router.get('/match-duration-by-surface', async (req, res) => {
  try {
    const startTime = Date.now();
    const result = await statsService.getMatchDurationStatsBySurface();
    const endTime = Date.now();

    res.json({
      stats: result,
      executionTimeMs: endTime - startTime
    });
  } catch (error) {
    console.error('Error getting match duration stats:', error);
    res.status(500).json({ error: 'Failed to get match duration statistics' });
  }
});

// Get aggregated player performance statistics
router.get('/player-performance', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const minMatches = req.query.minMatches ? parseInt(req.query.minMatches as string) : 10;
    
    const startTime = Date.now();
    const result = await statsService.getPlayerPerformanceStats(limit, minMatches);
    const endTime = Date.now();

    res.json({
      stats: result,
      executionTimeMs: endTime - startTime,
      count: result.length
    });
  } catch (error) {
    console.error('Error getting player performance stats:', error);
    res.status(500).json({ error: 'Failed to get player performance statistics' });
  }
});

// Get top tournament statistics by player count and match count
router.get('/tournament-stats', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const startTime = Date.now();
    const result = await statsService.getTournamentStatistics(limit);
    const endTime = Date.now();

    res.json({
      stats: result,
      executionTimeMs: endTime - startTime,
      count: result.length
    });
  } catch (error) {
    console.error('Error getting tournament statistics:', error);
    res.status(500).json({ error: 'Failed to get tournament statistics' });
  }
});

// Get match count by year and surface
router.get('/matches-by-year-surface', async (req, res) => {
  try {
    const startTime = Date.now();
    const result = await statsService.getMatchesByYearAndSurface();
    const endTime = Date.now();

    res.json({
      stats: result,
      executionTimeMs: endTime - startTime
    });
  } catch (error) {
    console.error('Error getting matches by year and surface:', error);
    res.status(500).json({ error: 'Failed to get matches by year and surface' });
  }
});

export default router; 