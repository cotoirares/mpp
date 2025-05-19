import mongoose from 'mongoose';
import { User, UserRole } from '../models/user.model';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tennisApp';

async function createTestUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('Test user already exists');
      return;
    }

    // Create test user
    const testUser = new User({
      email: 'test@example.com',
      password: 'password123',
      role: UserRole.USER
    });

    await testUser.save();
    console.log('Test user created successfully');

    // Create admin user
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (!existingAdmin) {
      const adminUser = new User({
        email: 'admin@example.com',
        password: 'admin123',
        role: UserRole.ADMIN
      });
      await adminUser.save();
      console.log('Admin user created successfully');
    }

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestUser(); 