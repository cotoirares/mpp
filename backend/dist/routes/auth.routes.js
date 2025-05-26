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
const express_1 = __importDefault(require("express"));
const auth_service_1 = require("../services/auth.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const authService = auth_service_1.AuthService.getInstance();
// Register new user
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, role } = req.body;
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        // Only allow ADMIN role if explicitly requested and validated
        const userRole = role === 'ADMIN' ? auth_service_1.UserRole.ADMIN : auth_service_1.UserRole.USER;
        const user = yield authService.register(email, password, userRole);
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user._id.toString(),
                email: user.email,
                role: user.role
            }
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
// Login
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, twoFactorToken } = req.body;
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const result = yield authService.login(email, password, twoFactorToken);
        if (result.requiresTwoFactor) {
            return res.json({
                message: '2FA required',
                requiresTwoFactor: true,
                user: {
                    id: result.user._id.toString(),
                    email: result.user.email,
                    role: result.user.role
                }
            });
        }
        res.json({
            message: 'Login successful',
            user: {
                id: result.user._id.toString(),
                email: result.user.email,
                role: result.user.role,
                twoFactorEnabled: result.user.twoFactorEnabled
            },
            token: result.token
        });
    }
    catch (error) {
        res.status(401).json({ message: error.message });
    }
}));
// Get current user profile
router.get('/profile', auth_middleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield authService.getUserById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            twoFactorEnabled: user.twoFactorEnabled
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
// Setup 2FA
router.post('/2fa/setup', auth_middleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield authService.setup2FA(req.user.userId);
        res.json({
            message: '2FA setup initiated',
            qrCodeUrl: result.qrCodeUrl,
            backupCodes: result.backupCodes
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
// Enable 2FA
router.post('/2fa/enable', auth_middleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: '2FA token is required' });
        }
        yield authService.enable2FA(req.user.userId, token);
        res.json({ message: '2FA enabled successfully' });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
// Disable 2FA
router.post('/2fa/disable', auth_middleware_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: '2FA token is required' });
        }
        yield authService.disable2FA(req.user.userId, token);
        res.json({ message: '2FA disabled successfully' });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}));
// Admin only route example
router.get('/admin/users', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)([auth_service_1.UserRole.ADMIN]), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield authService.getAllUsers();
        res.json(users.map(user => ({
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        })));
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
exports.default = router;
