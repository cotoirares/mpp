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
        const { email, password } = req.body;
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const { user, token } = yield authService.login(email, password);
        res.json({
            message: 'Login successful',
            user: {
                id: user._id.toString(),
                email: user.email,
                role: user.role
            },
            token
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
            updatedAt: user.updatedAt
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
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
