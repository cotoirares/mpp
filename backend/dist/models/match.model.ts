import mongoose, { Schema } from 'mongoose';

const matchSchema = new mongoose.Schema({
  tournament: {
    type: Schema.Types.ObjectId,
    ref: 'Tournament',
    required: [true, 'Tournament is required']
  },
  player1: {
    type: Schema.Types.ObjectId,
    ref: 'Player',
    required: [true, 'Player 1 is required']
  },
  player2: {
    type: Schema.Types.ObjectId,
    ref: 'Player',
    required: [true, 'Player 2 is required']
  },
  round: {
    type: String,
    required: [true, 'Round is required'],
    enum: ['Qualification', 'First Round', 'Second Round', 'Third Round', 'Fourth Round', 'Quarter-final', 'Semi-final', 'Final']
  },
  score: {
    type: String,
    required: false
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  winner: {
    type: Schema.Types.ObjectId,
    ref: 'Player',
    required: false
  },
  duration: {
    type: Number, // in minutes
    required: false
  },
  stats: {
    aces: {
      player1: { type: Number, default: 0 },
      player2: { type: Number, default: 0 }
    },
    doubleFaults: {
      player1: { type: Number, default: 0 },
      player2: { type: Number, default: 0 }
    },
    firstServePercentage: {
      player1: { type: Number, default: 0 },
      player2: { type: Number, default: 0 }
    },
    breakPointsConverted: {
      player1: { type: Number, default: 0 },
      player2: { type: Number, default: 0 }
    }
  }
}, {
  timestamps: true
});

export const Match = mongoose.model('Match', matchSchema); 