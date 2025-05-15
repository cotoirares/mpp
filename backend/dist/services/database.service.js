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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
class DatabaseService {
    constructor() {
        this.isConnected = false;
    }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isConnected) {
                return;
            }
            try {
                const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tennisApp';
                yield mongoose_1.default.connect(MONGODB_URI);
                this.isConnected = true;
                console.log('Connected to MongoDB');
            }
            catch (error) {
                console.error('MongoDB connection error:', error);
                throw error;
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isConnected) {
                return;
            }
            try {
                yield mongoose_1.default.disconnect();
                this.isConnected = false;
                console.log('Disconnected from MongoDB');
            }
            catch (error) {
                console.error('Error disconnecting from MongoDB:', error);
                throw error;
            }
        });
    }
}
exports.DatabaseService = DatabaseService;
