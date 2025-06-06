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
exports.Tournament = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const tournamentSchema = new mongoose_1.default.Schema({
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
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Player'
        }]
}, {
    timestamps: true
});
exports.Tournament = mongoose_1.default.model('Tournament', tournamentSchema);
