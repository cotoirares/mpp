import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import { Player } from '../models/player.model';
import { Tournament } from '../models/tournament.model';
import { Match } from '../models/match.model';
import path from 'path';
import fs from 'fs';
import { cpus } from 'os';
import { Worker } from 'worker_threads';

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tennisApp';
const NUM_PLAYERS = 10000;
const NUM_TOURNAMENTS = 1000;
const NUM_MATCHES = 100000;
const BATCH_SIZE = 1000;
const NUM_WORKERS = Math.max(1, cpus().length - 1); // Use all cores except one

// Categories and surfaces for tournaments
const TOURNAMENT_CATEGORIES = ['Grand Slam', 'Masters 1000', 'ATP 500', 'ATP 250', 'Challenger', 'ITF'];
const TOURNAMENT_SURFACES = ['Hard', 'Clay', 'Grass', 'Carpet', 'Indoor'];
const MATCH_ROUNDS = ['Qualification', 'First Round', 'Second Round', 'Third Round', 'Fourth Round', 'Quarter-final', 'Semi-final', 'Final'];

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Create database indexes for optimization
async function createIndexes() {
  console.log('Creating indexes...');
  
  // Player indexes
  await Player.collection.createIndex({ name: 1 });
  await Player.collection.createIndex({ country: 1 });
  await Player.collection.createIndex({ rank: 1 });
  
  // Tournament indexes
  await Tournament.collection.createIndex({ name: 1 });
  await Tournament.collection.createIndex({ startDate: 1 });
  await Tournament.collection.createIndex({ category: 1 });
  await Tournament.collection.createIndex({ surface: 1 });
  await Tournament.collection.createIndex({ players: 1 });
  
  // Match indexes - these are critical for complex queries
  await Match.collection.createIndex({ tournament: 1 });
  await Match.collection.createIndex({ player1: 1 });
  await Match.collection.createIndex({ player2: 1 });
  await Match.collection.createIndex({ winner: 1 });
  await Match.collection.createIndex({ date: 1 });
  await Match.collection.createIndex({ 'stats.aces.player1': 1 });
  await Match.collection.createIndex({ 'stats.aces.player2': 1 });
  
  // Compound indexes for frequent queries
  await Match.collection.createIndex({ player1: 1, player2: 1 });
  await Match.collection.createIndex({ tournament: 1, round: 1 });
  await Match.collection.createIndex({ player1: 1, winner: 1 });
  await Match.collection.createIndex({ player2: 1, winner: 1 });
  
  console.log('Indexes created successfully');
}

// Generate random player data
function generatePlayerData(index: number) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  
  return {
    name: `${firstName} ${lastName}`,
    age: faker.number.int({ min: 18, max: 40 }),
    rank: index + 1, // Ensure unique rankings
    country: faker.location.country(),
    grandSlams: faker.number.int({ min: 0, max: 24 }),
    hand: faker.helpers.arrayElement(['Right', 'Left']),
    height: faker.number.int({ min: 165, max: 210 })
  };
}

// Generate random tournament data
function generateTournamentData() {
  const startDate = faker.date.past({ years: 2 });
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + faker.number.int({ min: 7, max: 14 }));
  
  return {
    name: faker.company.name() + ' Open',
    location: `${faker.location.city()}, ${faker.location.country()}`,
    startDate,
    endDate,
    category: faker.helpers.arrayElement(TOURNAMENT_CATEGORIES),
    surface: faker.helpers.arrayElement(TOURNAMENT_SURFACES),
    prize: faker.number.int({ min: 50000, max: 5000000 }),
    players: [] as mongoose.Types.ObjectId[]
  };
}

// Generate random match data
function generateMatchData(tournamentIds: string[], playerIds: string[]) {
  const tournamentId = faker.helpers.arrayElement(tournamentIds);
  
  // Select two different players
  const player1Id = faker.helpers.arrayElement(playerIds);
  let player2Id = faker.helpers.arrayElement(playerIds);
  while (player1Id === player2Id) {
    player2Id = faker.helpers.arrayElement(playerIds);
  }
  
  // Determine winner
  const winnerId = faker.helpers.arrayElement([player1Id, player2Id]);
  
  // Match date
  const matchDate = faker.date.recent({ days: 365 * 2 });
  
  // Generate score
  const sets = faker.helpers.arrayElement([3, 5]);
  let score = '';
  
  for (let i = 0; i < sets; i++) {
    if (i > 0) score += ' ';
    const winnerGames = faker.number.int({ min: 6, max: 7 });
    const loserGames = winnerGames === 7 ? 6 : faker.number.int({ min: 0, max: 5 });
    score += `${winnerId === player1Id ? winnerGames : loserGames}-${winnerId === player1Id ? loserGames : winnerGames}`;
  }
  
  return {
    tournament: tournamentId,
    player1: player1Id,
    player2: player2Id,
    round: faker.helpers.arrayElement(MATCH_ROUNDS),
    score,
    date: matchDate,
    winner: winnerId,
    duration: faker.number.int({ min: 60, max: 300 }),
    stats: {
      aces: {
        player1: faker.number.int({ min: 0, max: 30 }),
        player2: faker.number.int({ min: 0, max: 30 })
      },
      doubleFaults: {
        player1: faker.number.int({ min: 0, max: 15 }),
        player2: faker.number.int({ min: 0, max: 15 })
      },
      firstServePercentage: {
        player1: faker.number.int({ min: 40, max: 85 }),
        player2: faker.number.int({ min: 40, max: 85 })
      },
      breakPointsConverted: {
        player1: faker.number.int({ min: 20, max: 90 }),
        player2: faker.number.int({ min: 20, max: 90 })
      }
    }
  };
}

// Generate data in batches
async function generateData() {
  console.log('Clearing existing data...');
  await Promise.all([
    Player.deleteMany({}),
    Tournament.deleteMany({}),
    Match.deleteMany({})
  ]);
  
  console.log('Generating players...');
  const playerIds: string[] = [];
  
  for (let i = 0; i < NUM_PLAYERS; i += BATCH_SIZE) {
    const playerBatch = [];
    const batchSize = Math.min(BATCH_SIZE, NUM_PLAYERS - i);
    
    for (let j = 0; j < batchSize; j++) {
      playerBatch.push(generatePlayerData(i + j));
    }
    
    const savedPlayers = await Player.insertMany(playerBatch);
    playerIds.push(...savedPlayers.map(p => p._id.toString()));
    console.log(`Inserted ${playerIds.length} players so far`);
  }
  
  console.log('Generating tournaments...');
  const tournamentIds: string[] = [];
  
  for (let i = 0; i < NUM_TOURNAMENTS; i += BATCH_SIZE) {
    const tournamentBatch = [];
    const batchSize = Math.min(BATCH_SIZE, NUM_TOURNAMENTS - i);
    
    for (let j = 0; j < batchSize; j++) {
      const tournament = generateTournamentData();
      // Assign random players to each tournament (16-128 players)
      const numPlayers = faker.helpers.arrayElement([16, 32, 64, 128]);
      const tournamentPlayers = faker.helpers.arrayElements(playerIds, numPlayers);
      tournament.players = tournamentPlayers.map(id => new mongoose.Types.ObjectId(id));
      tournamentBatch.push(tournament);
    }
    
    const savedTournaments = await Tournament.insertMany(tournamentBatch);
    tournamentIds.push(...savedTournaments.map(t => t._id.toString()));
    console.log(`Inserted ${tournamentIds.length} tournaments so far`);
  }
  
  console.log('Generating matches...');
  
  // Use worker threads for match generation to improve performance
  if (NUM_WORKERS > 1) {
    await generateMatchesWithWorkers(tournamentIds, playerIds);
  } else {
    await generateMatchesSequentially(tournamentIds, playerIds);
  }
  
  console.log('Data generation complete!');
}

// Generate matches using worker threads
async function generateMatchesWithWorkers(tournamentIds: string[], playerIds: string[]) {
  const matchesPerWorker = Math.ceil(NUM_MATCHES / NUM_WORKERS);
  const workerPromises = [];
  
  for (let workerId = 0; workerId < NUM_WORKERS; workerId++) {
    const startIndex = workerId * matchesPerWorker;
    const endIndex = Math.min(startIndex + matchesPerWorker, NUM_MATCHES);
    const numMatches = endIndex - startIndex;
    
    const workerData = {
      workerId,
      tournamentIds,
      playerIds,
      numMatches,
      batchSize: BATCH_SIZE,
      mongoUri: MONGODB_URI
    };
    
    workerPromises.push(runWorker(workerData));
  }
  
  await Promise.all(workerPromises);
}

// Run a worker thread
function runWorker(workerData: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const workerPath = path.resolve(__dirname, 'matchGeneratorWorker.js');
    
    // Create the worker file if it doesn't exist
    if (!fs.existsSync(workerPath)) {
      const workerCode = `
const { parentPort, workerData } = require('worker_threads');
const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Match schema for worker
const matchSchema = new Schema({
  tournament: { type: Schema.Types.ObjectId, ref: 'Tournament' },
  player1: { type: Schema.Types.ObjectId, ref: 'Player' },
  player2: { type: Schema.Types.ObjectId, ref: 'Player' },
  round: String,
  score: String,
  date: Date,
  winner: { type: Schema.Types.ObjectId, ref: 'Player' },
  duration: Number,
  stats: {
    aces: {
      player1: Number,
      player2: Number
    },
    doubleFaults: {
      player1: Number,
      player2: Number
    },
    firstServePercentage: {
      player1: Number,
      player2: Number
    },
    breakPointsConverted: {
      player1: Number,
      player2: Number
    }
  }
});

const Match = mongoose.model('Match', matchSchema);
const MATCH_ROUNDS = ['Qualification', 'First Round', 'Second Round', 'Third Round', 'Fourth Round', 'Quarter-final', 'Semi-final', 'Final'];

async function run() {
  const { workerId, tournamentIds, playerIds, numMatches, batchSize, mongoUri } = workerData;
  
  try {
    await mongoose.connect(mongoUri);
    console.log(\`Worker \${workerId}: Connected to MongoDB\`);
    
    for (let i = 0; i < numMatches; i += batchSize) {
      const matchBatch = [];
      const batchSize = Math.min(workerData.batchSize, numMatches - i);
      
      for (let j = 0; j < batchSize; j++) {
        matchBatch.push(generateMatchData(tournamentIds, playerIds));
      }
      
      await Match.insertMany(matchBatch);
      console.log(\`Worker \${workerId}: Inserted \${i + batchSize} matches so far\`);
    }
    
    console.log(\`Worker \${workerId}: Completed generating \${numMatches} matches\`);
    parentPort.postMessage({ success: true });
  } catch (error) {
    console.error(\`Worker \${workerId} error:\`, error);
    parentPort.postMessage({ success: false, error: error.message });
  } finally {
    await mongoose.disconnect();
  }
}

// Generate random match data
function generateMatchData(tournamentIds, playerIds) {
  const tournamentId = faker.helpers.arrayElement(tournamentIds);
  
  // Select two different players
  const player1Id = faker.helpers.arrayElement(playerIds);
  let player2Id = faker.helpers.arrayElement(playerIds);
  while (player1Id === player2Id) {
    player2Id = faker.helpers.arrayElement(playerIds);
  }
  
  // Determine winner
  const winnerId = faker.helpers.arrayElement([player1Id, player2Id]);
  
  // Match date
  const matchDate = faker.date.recent({ days: 365 * 2 });
  
  // Generate score
  const sets = faker.helpers.arrayElement([3, 5]);
  let score = '';
  
  for (let i = 0; i < sets; i++) {
    if (i > 0) score += ' ';
    const winnerGames = faker.number.int({ min: 6, max: 7 });
    const loserGames = winnerGames === 7 ? 6 : faker.number.int({ min: 0, max: 5 });
    score += \`\${winnerId === player1Id ? winnerGames : loserGames}-\${winnerId === player1Id ? loserGames : winnerGames}\`;
  }
  
  return {
    tournament: tournamentId,
    player1: player1Id,
    player2: player2Id,
    round: faker.helpers.arrayElement(MATCH_ROUNDS),
    score,
    date: matchDate,
    winner: winnerId,
    duration: faker.number.int({ min: 60, max: 300 }),
    stats: {
      aces: {
        player1: faker.number.int({ min: 0, max: 30 }),
        player2: faker.number.int({ min: 0, max: 30 })
      },
      doubleFaults: {
        player1: faker.number.int({ min: 0, max: 15 }),
        player2: faker.number.int({ min: 0, max: 15 })
      },
      firstServePercentage: {
        player1: faker.number.int({ min: 40, max: 85 }),
        player2: faker.number.int({ min: 40, max: 85 })
      },
      breakPointsConverted: {
        player1: faker.number.int({ min: 20, max: 90 }),
        player2: faker.number.int({ min: 20, max: 90 })
      }
    }
  };
}

run();
      `;
      
      fs.writeFileSync(workerPath, workerCode);
    }
    
    const worker = new Worker(workerPath, { workerData });
    
    worker.on('message', (message) => {
      if (message.success) {
        resolve();
      } else {
        reject(new Error(message.error));
      }
    });
    
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

// Generate matches sequentially
async function generateMatchesSequentially(tournamentIds: string[], playerIds: string[]) {
  for (let i = 0; i < NUM_MATCHES; i += BATCH_SIZE) {
    const matchBatch = [];
    const batchSize = Math.min(BATCH_SIZE, NUM_MATCHES - i);
    
    for (let j = 0; j < batchSize; j++) {
      matchBatch.push(generateMatchData(tournamentIds, playerIds));
    }
    
    await Match.insertMany(matchBatch);
    console.log(`Inserted ${i + batchSize} matches so far`);
  }
}

// Create optimized endpoints
async function createOptimizedEndpoints() {
  // Implementation will be in a separate file
  console.log('Optimized endpoints will be created separately');
}

// Main function
async function main() {
  console.time('Data generation');
  
  await connectToDatabase();
  await createIndexes();
  await generateData();
  
  console.timeEnd('Data generation');
  console.log('Database population completed successfully!');
  
  // Disconnect from MongoDB
  await mongoose.disconnect();
  process.exit(0);
}

// Run the script
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 