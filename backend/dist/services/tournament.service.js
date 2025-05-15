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
exports.TournamentService = void 0;
const tournament_model_1 = require("../models/tournament.model");
const mongoose_1 = __importDefault(require("mongoose"));
class TournamentService {
    constructor() { }
    static getInstance() {
        if (!TournamentService.instance) {
            TournamentService.instance = new TournamentService();
        }
        return TournamentService.instance;
    }
    mapToTournament(doc) {
        const { _id } = doc, rest = __rest(doc, ["_id"]);
        return Object.assign(Object.assign({}, rest), { id: _id.toString() });
    }
    createTournament(tournamentData) {
        return __awaiter(this, void 0, void 0, function* () {
            const tournament = new tournament_model_1.Tournament(tournamentData);
            yield tournament.save();
            return this.mapToTournament(tournament.toObject());
        });
    }
    getAllTournaments() {
        return __awaiter(this, arguments, void 0, function* (filter = {}) {
            const query = {};
            if (filter.name) {
                query.name = { $regex: filter.name, $options: 'i' };
            }
            if (filter.location) {
                query.location = { $regex: filter.location, $options: 'i' };
            }
            if (filter.category) {
                query.category = filter.category;
            }
            if (filter.surface) {
                query.surface = filter.surface;
            }
            if (filter.startDate) {
                query.startDate = { $gte: filter.startDate };
            }
            if (filter.endDate) {
                query.endDate = { $lte: filter.endDate };
            }
            if (filter.minPrize !== undefined) {
                query.prize = Object.assign(Object.assign({}, query.prize), { $gte: filter.minPrize });
            }
            if (filter.maxPrize !== undefined) {
                query.prize = Object.assign(Object.assign({}, query.prize), { $lte: filter.maxPrize });
            }
            const tournaments = yield tournament_model_1.Tournament.find(query).populate('players');
            return tournaments.map(tournament => this.mapToTournament(tournament.toObject()));
        });
    }
    getTournamentById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const tournament = yield tournament_model_1.Tournament.findById(id).populate('players');
            return tournament ? this.mapToTournament(tournament.toObject()) : null;
        });
    }
    updateTournament(id, tournamentData) {
        return __awaiter(this, void 0, void 0, function* () {
            const tournament = yield tournament_model_1.Tournament.findByIdAndUpdate(id, tournamentData, { new: true });
            return tournament ? this.mapToTournament(tournament.toObject()) : null;
        });
    }
    deleteTournament(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield tournament_model_1.Tournament.findByIdAndDelete(id);
            return !!result;
        });
    }
    addPlayerToTournament(tournamentId, playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const tournament = yield tournament_model_1.Tournament.findById(tournamentId);
            if (!tournament) {
                return null;
            }
            const playerObjectId = new mongoose_1.default.Types.ObjectId(playerId);
            if (!tournament.players.some(id => id.equals(playerObjectId))) {
                tournament.players.push(playerObjectId);
                yield tournament.save();
            }
            return this.mapToTournament(tournament.toObject());
        });
    }
    removePlayerFromTournament(tournamentId, playerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const tournament = yield tournament_model_1.Tournament.findById(tournamentId);
            if (!tournament) {
                return null;
            }
            tournament.players = tournament.players.filter(id => !id.equals(new mongoose_1.default.Types.ObjectId(playerId)));
            yield tournament.save();
            return this.mapToTournament(tournament.toObject());
        });
    }
}
exports.TournamentService = TournamentService;
