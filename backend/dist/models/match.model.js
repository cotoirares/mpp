"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Match = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const matchSchema = new mongoose_1.default.Schema({
    tournament: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: [true, 'Tournament is required']
    },
    player1: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Player',
        required: [true, 'Player 1 is required']
    },
    player2: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
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
exports.Match = mongoose_1.default.model('Match', matchSchema);
