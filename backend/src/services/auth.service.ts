import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export interface User {
  _id: ObjectId;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  isMonitored: boolean;
}

export class AuthService {
  private static instance: AuthService;
  private client: MongoClient;
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly JWT_EXPIRES_IN = '24h';
  private readonly dbName = 'tennisApp';
  private readonly collectionName = 'users';

  private constructor() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    this.client = new MongoClient(uri);
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async getCollection() {
    await this.client.connect();
    return this.client.db(this.dbName).collection<User>(this.collectionName);
  }

  async register(email: string, password: string, role: UserRole = UserRole.USER): Promise<User> {
    const collection = await this.getCollection();

    // Check if user already exists
    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const now = new Date();
    const user: Omit<User, '_id'> = {
      email,
      password: hashedPassword,
      role,
      createdAt: now,
      updatedAt: now,
      isMonitored: false
    };

    const result = await collection.insertOne(user as User);
    return { ...user, _id: result.insertedId };
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const collection = await this.getCollection();

    // Find user
    const user = await collection.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );

    return { user, token };
  }

  async validateToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET);
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async getUserById(id: string): Promise<User | null> {
    const collection = await this.getCollection();
    return collection.findOne({ _id: new ObjectId(id) });
  }

  async getAllUsers(): Promise<User[]> {
    const collection = await this.getCollection();
    return collection.find({}, {
      projection: {
        password: 0 // Exclude password from results
      }
    }).toArray();
  }

  async closeConnection() {
    await this.client.close();
  }
} 