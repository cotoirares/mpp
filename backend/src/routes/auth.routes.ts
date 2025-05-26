import express from 'express';
import { AuthService, UserRole } from '../services/auth.service';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { ObjectId } from 'mongodb';

const router = express.Router();
const authService = AuthService.getInstance();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Only allow ADMIN role if explicitly requested and validated
    const userRole = role === 'ADMIN' ? UserRole.ADMIN : UserRole.USER;
    
    const user = await authService.register(email, password, userRole);
    res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, twoFactorToken } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const result = await authService.login(email, password, twoFactorToken);
    
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
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await authService.getUserById(req.user!.userId);
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
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Setup 2FA
router.post('/2fa/setup', authenticate, async (req, res) => {
  try {
    const result = await authService.setup2FA(req.user!.userId);
    res.json({
      message: '2FA setup initiated',
      qrCodeUrl: result.qrCodeUrl,
      backupCodes: result.backupCodes
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Enable 2FA
router.post('/2fa/enable', authenticate, async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: '2FA token is required' });
    }

    await authService.enable2FA(req.user!.userId, token);
    res.json({ message: '2FA enabled successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Disable 2FA
router.post('/2fa/disable', authenticate, async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: '2FA token is required' });
    }

    await authService.disable2FA(req.user!.userId, token);
    res.json({ message: '2FA disabled successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Admin only route example
router.get('/admin/users', authenticate, requireRole([UserRole.ADMIN]), async (req, res) => {
  try {
    const users = await authService.getAllUsers();
    res.json(users.map(user => ({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    })));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 