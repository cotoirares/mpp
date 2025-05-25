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
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = require("../models/user.model");
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tennisApp';
function createTestUser() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connect(MONGODB_URI);
            console.log('Connected to MongoDB');
            // Check if test user already exists
            const existingUser = yield user_model_1.User.findOne({ email: 'test@example.com' });
            if (existingUser) {
                console.log('Test user already exists');
                return;
            }
            // Create test user
            const testUser = new user_model_1.User({
                email: 'test@example.com',
                password: 'password123',
                role: user_model_1.UserRole.USER
            });
            yield testUser.save();
            console.log('Test user created successfully');
            // Create admin user
            const existingAdmin = yield user_model_1.User.findOne({ email: 'admin@example.com' });
            if (!existingAdmin) {
                const adminUser = new user_model_1.User({
                    email: 'admin@example.com',
                    password: 'admin123',
                    role: user_model_1.UserRole.ADMIN
                });
                yield adminUser.save();
                console.log('Admin user created successfully');
            }
        }
        catch (error) {
            console.error('Error creating test user:', error);
        }
        finally {
            yield mongoose_1.default.disconnect();
        }
    });
}
createTestUser();
