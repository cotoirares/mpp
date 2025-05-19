import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const uri = 'mongodb://localhost:27017/tennisApp';

async function createTestUser() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Check if users collection exists
    const collections = await db.listCollections({ name: 'users' }).toArray();
    if (collections.length === 0) {
      console.log('Creating users collection...');
      await db.createCollection('users');
    }
    
    // Check if test user already exists
    const existingUser = await usersCollection.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('Test user already exists');
      return;
    }
    
    // Create a test user
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);
    
    const result = await usersCollection.insertOne({
      email: 'test@example.com',
      password: password,
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('Test user created:', result.insertedId);
    
    // Create an admin user as well
    const adminExists = await usersCollection.findOne({ email: 'admin@example.com' });
    if (!adminExists) {
      const adminPassword = await bcrypt.hash('admin123', salt);
      const adminResult = await usersCollection.insertOne({
        email: 'admin@example.com',
        password: adminPassword,
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Admin user created:', adminResult.insertedId);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

createTestUser(); 