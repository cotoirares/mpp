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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchService = void 0;
const match_model_1 = require("../models/match.model");
const mongoose_1 = __importDefault(require("mongoose"));
class MatchService {
    constructor() { }
    static getInstance() {
        if (!MatchService.instance) {
            MatchService.instance = new MatchService();
        }
        return MatchService.instance;
    }
    mapToMatch(doc) {
        const { _id } = doc, rest = __rest(doc, ["_id"]);
        return Object.assign(Object.assign({}, rest), { id: _id.toString() });
    }
    createMatch(matchData) {
        return __awaiter(this, void 0, void 0, function* () {
            const match = new match_model_1.Match(matchData);
            yield match.save();
            return this.mapToMatch(match.toObject());
        });
    }
    getAllMatches() {
        return __awaiter(this, arguments, void 0, function* (filter = {}) {
            const query = {};
            if (filter.tournament) {
                query.tournament = new mongoose_1.default.Types.ObjectId(filter.tournament);
            }
            if (filter.player) {
                const playerId = new mongoose_1.default.Types.ObjectId(filter.player);
                query.$or = [
                    { player1: playerId },
                    { player2: playerId }
                ];
            }
            if (filter.round) {
                query.round = filter.round;
            }
            if (filter.winner) {
                query.winner = new mongoose_1.default.Types.ObjectId(filter.winner);
            }
            if (filter.startDate) {
                query.date = Object.assign(Object.assign({}, query.date), { $gte: filter.startDate });
            }
            if (filter.endDate) {
                query.date = Object.assign(Object.assign({}, query.date), { $lte: filter.endDate });
            }
            if (filter.minDuration !== undefined) {
                query.duration = Object.assign(Object.assign({}, query.duration), { $gte: filter.minDuration });
            }
            if (filter.maxDuration !== undefined) {
                query.duration = Object.assign(Object.assign({}, query.duration), { $lte: filter.maxDuration });
            }
            const matches = yield match_model_1.Match.find(query)
                .populate('tournament')
                .populate('player1')
                .populate('player2')
                .populate('winner');
            return matches.map(match => this.mapToMatch(match.toObject()));
        });
    }
    getMatchById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const match = yield match_model_1.Match.findById(id)
                .populate('tournament')
                .populate('player1')
                .populate('player2')
                .populate('winner');
            return match ? this.mapToMatch(match.toObject()) : null;
        });
    }
    updateMatch(id, matchData) {
        return __awaiter(this, void 0, void 0, function* () {
            const match = yield match_model_1.Match.findByIdAndUpdate(id, matchData, { new: true });
            return match ? this.mapToMatch(match.toObject()) : null;
        });
    }
    deleteMatch(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield match_model_1.Match.findByIdAndDelete(id);
            return !!result;
        });
    }
    getMatchesByTournament(tournamentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const matches = yield match_model_1.Match.find({ tournament: new mongoose_1.default.Types.ObjectId(tournamentId) })
                .populate('player1')
                .populate('player2')
                .populate('winner');
            return matches.map(match => this.mapToMatch(match.toObject()));
        });
    }
    getMatchesByPlayer(playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const playerObjectId = new mongoose_1.default.Types.ObjectId(playerId);
            const matches = yield match_model_1.Match.find({
                $or: [
                    { player1: playerObjectId },
                    { player2: playerObjectId }
                ]
            })
                .populate('tournament')
                .populate('player1')
                .populate('player2')
                .populate('winner');
            return matches.map(match => this.mapToMatch(match.toObject()));
        });
    }
    updateMatchScore(id, score, winnerId, duration, stats) {
        return __awaiter(this, void 0, void 0, function* () {
            const match = yield match_model_1.Match.findById(id);
            if (!match) {
                return null;
            }
            match.score = score;
            match.winner = new mongoose_1.default.Types.ObjectId(winnerId);
            match.duration = duration;
            match.stats = stats;
            yield match.save();
            return this.mapToMatch(match.toObject());
        });
    }
}
exports.MatchService = MatchService;
