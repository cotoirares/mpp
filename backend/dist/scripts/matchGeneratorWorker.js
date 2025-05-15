
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
    console.log(`Worker ${workerId}: Connected to MongoDB`);
    
    for (let i = 0; i < numMatches; i += batchSize) {
      const matchBatch = [];
      const batchSize = Math.min(workerData.batchSize, numMatches - i);
      
      for (let j = 0; j < batchSize; j++) {
        matchBatch.push(generateMatchData(tournamentIds, playerIds));
      }
      
      await Match.insertMany(matchBatch);
      console.log(`Worker ${workerId}: Inserted ${i + batchSize} matches so far`);
    }
    
    console.log(`Worker ${workerId}: Completed generating ${numMatches} matches`);
    parentPort.postMessage({ success: true });
  } catch (error) {
    console.error(`Worker ${workerId} error:`, error);
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

run();
      