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
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
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
                isMonitored: false,
                twoFactorEnabled: false,
                twoFactorBackupCodes: []
            };
            const result = yield collection.insertOne(user);
            return Object.assign(Object.assign({}, user), { _id: result.insertedId });
        });
    }
    login(email, password, twoFactorToken) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
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
            // Check if 2FA is enabled
            if (user.twoFactorEnabled) {
                if (!twoFactorToken) {
                    return { user, token: '', requiresTwoFactor: true };
                }
                // Verify 2FA token
                const isValid2FA = this.verify2FAToken(user.twoFactorSecret, twoFactorToken);
                if (!isValid2FA) {
                    // Check backup codes
                    const isValidBackupCode = (_a = user.twoFactorBackupCodes) === null || _a === void 0 ? void 0 : _a.includes(twoFactorToken);
                    if (!isValidBackupCode) {
                        throw new Error('Invalid 2FA token');
                    }
                    // Remove used backup code
                    yield collection.updateOne({ _id: user._id }, { $pull: { twoFactorBackupCodes: twoFactorToken } });
                }
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
    // 2FA Methods
    setup2FA(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = yield this.getCollection();
            const user = yield collection.findOne({ _id: new mongodb_1.ObjectId(userId) });
            if (!user) {
                throw new Error('User not found');
            }
            // Generate secret
            const secret = speakeasy_1.default.generateSecret({
                name: `Tennis App (${user.email})`,
                issuer: 'Tennis App'
            });
            // Generate backup codes
            const backupCodes = this.generateBackupCodes();
            // Generate QR code
            const qrCodeUrl = yield qrcode_1.default.toDataURL(secret.otpauth_url);
            // Save secret to user (but don't enable 2FA yet)
            yield collection.updateOne({ _id: new mongodb_1.ObjectId(userId) }, {
                $set: {
                    twoFactorSecret: secret.base32,
                    twoFactorBackupCodes: backupCodes
                }
            });
            return {
                secret: secret.base32,
                qrCodeUrl,
                backupCodes
            };
        });
    }
    enable2FA(userId, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = yield this.getCollection();
            const user = yield collection.findOne({ _id: new mongodb_1.ObjectId(userId) });
            if (!user || !user.twoFactorSecret) {
                throw new Error('2FA setup not found');
            }
            // Verify the token
            const isValid = this.verify2FAToken(user.twoFactorSecret, token);
            if (!isValid) {
                throw new Error('Invalid 2FA token');
            }
            // Enable 2FA
            yield collection.updateOne({ _id: new mongodb_1.ObjectId(userId) }, { $set: { twoFactorEnabled: true } });
            return true;
        });
    }
    disable2FA(userId, token) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const collection = yield this.getCollection();
            const user = yield collection.findOne({ _id: new mongodb_1.ObjectId(userId) });
            if (!user || !user.twoFactorEnabled) {
                throw new Error('2FA not enabled');
            }
            // Verify the token or backup code
            const isValidToken = this.verify2FAToken(user.twoFactorSecret, token);
            const isValidBackupCode = (_a = user.twoFactorBackupCodes) === null || _a === void 0 ? void 0 : _a.includes(token);
            if (!isValidToken && !isValidBackupCode) {
                throw new Error('Invalid 2FA token');
            }
            // Disable 2FA and clear secrets
            yield collection.updateOne({ _id: new mongodb_1.ObjectId(userId) }, {
                $set: { twoFactorEnabled: false },
                $unset: {
                    twoFactorSecret: "",
                    twoFactorBackupCodes: ""
                }
            });
            return true;
        });
    }
    verify2FAToken(secret, token) {
        return speakeasy_1.default.totp.verify({
            secret,
            encoding: 'base32',
            token,
            window: 2 // Allow some time drift
        });
    }
    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
        }
        return codes;
    }
}
exports.AuthService = AuthService;
