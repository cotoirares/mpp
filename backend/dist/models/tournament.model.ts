import mongoose, { Schema } from 'mongoose';

const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tournament name is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Grand Slam', 'Masters 1000', 'ATP 500', 'ATP 250', 'Challenger', 'ITF']
  },
  surface: {
    type: String,
    required: [true, 'Surface is required'],
    enum: ['Hard', 'Clay', 'Grass', 'Carpet', 'Indoor']
  },
  prize: {
    type: Number,
    required: [true, 'Prize money is required'],
    min: [0, 'Prize money cannot be negative']
  },
  players: [{
    type: Schema.Types.ObjectId,
    ref: 'Player'
  }]
}, {
  timestamps: true
});

export const Tournament = mongoose.model('Tournament', tournamentSchema); 