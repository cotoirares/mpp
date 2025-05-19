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
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const { user, token } = await authService.login(email, password);
    res.json({
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role
      },
      token
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
      updatedAt: user.updatedAt
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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