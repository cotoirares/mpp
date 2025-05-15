"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const playerSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    age: {
        type: Number,
        required: [true, 'Age is required'],
        min: [1, 'Age must be greater than 0']
    },
    rank: {
        type: Number,
        required: [true, 'Rank is required'],
        min: [1, 'Rank must be greater than 0']
    },
    country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true
    },
    grandSlams: {
        type: Number,
        required: [true, 'Grand Slams count is required'],
        min: [0, 'Grand Slams cannot be negative']
    },
    hand: {
        type: String,
        required: [true, 'Hand preference is required'],
        enum: ['Right', 'Left']
    },
    height: {
        type: Number,
        required: [true, 'Height is required'],
        min: [100, 'Height must be at least 100 cm']
    },
    videoUrl: {
        type: String,
        required: false
    },
    videoSize: {
        type: Number,
        required: false
    },
    videoType: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});
exports.Player = mongoose_1.default.model('Player', playerSchema);
