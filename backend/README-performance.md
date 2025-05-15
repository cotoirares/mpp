# Tennis App Performance Testing

This documentation explains how to populate the database with a large dataset and run performance tests using JMeter.

## Prerequisites

- Node.js and npm installed
- MongoDB installed and running
- JMeter installed (for performance testing)

## Database Population

The application includes a script to populate the database with a large amount of data using Faker.js. This script will:

1. Generate 10,000 player records
2. Generate 1,000 tournament records
3. Generate 100,000 match records
4. Create necessary database indexes for performance optimization

### Running the Data Population Script

1. Make sure MongoDB is running
2. Navigate to the backend directory:

```bash
cd backend
```

3. Install dependencies if you haven't already:

```bash
npm install
```

4. Compile TypeScript files:

```bash
npm run build
```

5. Run the data population script:

```bash
node dist/scripts/generateLargeDataset.js
```

The script will use worker threads to maximize performance when populating the database. It may take several minutes to complete depending on your hardware.

## Database Optimization

The data population script automatically creates the following indexes to optimize query performance:

### Player Indexes
- `name`: For quick search by player name
- `country`: For filtering by country
- `rank`: For sorting and filtering by rank

### Tournament Indexes
- `name`: For quick search by tournament name
- `startDate`: For date-based filtering and sorting
- `category`: For filtering by tournament category
- `surface`: For filtering by playing surface
- `players`: For querying which tournaments a player participated in

### Match Indexes
- `tournament`: For finding matches in a specific tournament
- `player1`, `player2`: For finding matches involving specific players
- `winner`: For finding matches won by a specific player
- `date`: For date-based filtering and sorting
- `stats.aces.player1`, `stats.aces.player2`: For statistical queries

### Compound Indexes
- `{player1: 1, player2: 1}`: For quickly finding matches between two specific players
- `{tournament: 1, round: 1}`: For finding matches in a specific tournament round
- `{player1: 1, winner: 1}`: For win/loss statistics for player1
- `{player2: 1, winner: 1}`: For win/loss statistics for player2

## Optimized API Endpoints

The application provides several optimized endpoints for complex statistical queries:

- **GET /api/stats/player-win-percentages**: Returns player win percentages by surface type
- **GET /api/stats/match-duration-by-surface**: Returns match duration statistics by playing surface
- **GET /api/stats/player-performance**: Returns comprehensive player performance statistics
- **GET /api/stats/tournament-stats**: Returns tournament statistics by player and match count
- **GET /api/stats/matches-by-year-surface**: Returns match counts by year and surface

Each endpoint includes the execution time in milliseconds to track performance.

## Performance Testing with JMeter

The repository includes a JMeter test plan to benchmark the performance of the optimized endpoints.

### Running the JMeter Tests

1. Start the Tennis App backend server:

```bash
cd backend
npm run start
```

2. Open JMeter:

```bash
jmeter
```

3. Load the test plan:
   - Click "Open" in JMeter
   - Navigate to the backend directory and select `performance-test-plan.jmx`

4. Run the test:
   - Click the green "Start" button in JMeter

5. View the results:
   - Check the "Summary Report", "Graph Results", and "View Results Tree" elements

### Test Configuration

The test plan includes three test groups that simulate high load:

1. **Player Win Percentages Test**:
   - 50 concurrent users
   - Each user makes 20 requests
   - Tests the `/api/stats/player-win-percentages` endpoint

2. **Player Performance Test**:
   - 50 concurrent users
   - Each user makes 20 requests
   - Tests the `/api/stats/player-performance` endpoint

3. **Match Duration By Surface Test**:
   - 50 concurrent users
   - Each user makes 20 requests
   - Tests the `/api/stats/match-duration-by-surface` endpoint

## Analyzing Performance Results

After running the tests, you can analyze the results in JMeter to see:

- Average response time
- Throughput (requests per second)
- Error rate
- Min/Max response times

A well-optimized system should maintain consistent response times even under heavy load. Response times that increase significantly under load may indicate optimization opportunities.

## Further Optimization Strategies

If you need to further optimize performance:

1. Increase MongoDB hardware resources (RAM, CPU)
2. Add more specific compound indexes based on query patterns
3. Implement caching for frequently accessed data using Redis
4. Split read and write operations to different MongoDB replicas
5. Consider MongoDB sharding for horizontal scaling
6. Implement request rate limiting to prevent abuse 