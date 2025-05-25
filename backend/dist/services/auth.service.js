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
exports.AuthService = exports.UserRole = void 0;
const mongodb_1 = require("mongodb");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "USER";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
class AuthService {
    constructor() {
        this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
        this.JWT_EXPIRES_IN = '24h';
        this.dbName = 'tennisApp';
        this.collectionName = 'users';
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
        this.client = new mongodb_1.MongoClient(uri);
    }
    static getInstance() {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }
    getCollection() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.connect();
            return this.client.db(this.dbName).collection(this.collectionName);
        });
    }
    register(email_1, password_1) {
        return __awaiter(this, arguments, void 0, function* (email, password, role = UserRole.USER) {
            const collection = yield this.getCollection();
            // Check if user already exists
            const existingUser = yield collection.findOne({ email });
            if (existingUser) {
                throw new Error('User already exists');
            }
            // Hash password
            const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
            // Create user
            const now = new Date();
            const user = {
                email,
                password: hashedPassword,
                role,
                createdAt: now,
                updatedAt: now,
                isMonitored: false
            };
            const result = yield collection.insertOne(user);
            return Object.assign(Object.assign({}, user), { _id: result.insertedId });
        });
    }
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = yield this.getCollection();
            // Find user
            const user = yield collection.findOne({ email });
            if (!user) {
                throw new Error('Invalid credentials');
            }
            // Check password
            const isValidPassword = yield bcryptjs_1.default.compare(password, user.password);
            if (!isValidPassword) {
                throw new Error('Invalid credentials');
            }
            // Generate JWT token
            const token = jsonwebtoken_1.default.sign({
                userId: user._id.toString(),
                email: user.email,
                role: user.role
            }, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });
            return { user, token };
        });
    }
    validateToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const decoded = jsonwebtoken_1.default.verify(token, this.JWT_SECRET);
                return decoded;
            }
            catch (error) {
                throw new Error('Invalid token');
            }
        });
    }
    getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = yield this.getCollection();
            return collection.findOne({ _id: new mongodb_1.ObjectId(id) });
        });
    }
    getAllUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = yield this.getCollection();
            return collection.find({}, {
                projection: {
                    password: 0 // Exclude password from results
                }
            }).toArray();
        });
    }
    closeConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.client.close();
        });
    }
}
exports.AuthService = AuthService;
