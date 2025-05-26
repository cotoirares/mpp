import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

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
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
  twoFactorBackupCodes?: string[];
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
      isMonitored: false,
      twoFactorEnabled: false,
      twoFactorBackupCodes: []
    };

    const result = await collection.insertOne(user as User);
    return { ...user, _id: result.insertedId };
  }

  async login(email: string, password: string, twoFactorToken?: string): Promise<{ user: User; token: string; requiresTwoFactor?: boolean }> {
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

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorToken) {
        return { user, token: '', requiresTwoFactor: true };
      }

      // Verify 2FA token
      const isValid2FA = this.verify2FAToken(user.twoFactorSecret!, twoFactorToken);
      if (!isValid2FA) {
        // Check backup codes
        const isValidBackupCode = user.twoFactorBackupCodes?.includes(twoFactorToken);
        if (!isValidBackupCode) {
          throw new Error('Invalid 2FA token');
        }
        
        // Remove used backup code
        await collection.updateOne(
          { _id: user._id },
          { $pull: { twoFactorBackupCodes: twoFactorToken } }
        );
      }
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

  // 2FA Methods
  async setup2FA(userId: string): Promise<{ secret: string; qrCodeUrl: string; backupCodes: string[] }> {
    const collection = await this.getCollection();
    const user = await collection.findOne({ _id: new ObjectId(userId) });
    
    if (!user) {
      throw new Error('User not found');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Tennis App (${user.email})`,
      issuer: 'Tennis App'
    });

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Save secret to user (but don't enable 2FA yet)
    await collection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          twoFactorSecret: secret.base32,
          twoFactorBackupCodes: backupCodes
        } 
      }
    );

    return {
      secret: secret.base32!,
      qrCodeUrl,
      backupCodes
    };
  }

  async enable2FA(userId: string, token: string): Promise<boolean> {
    const collection = await this.getCollection();
    const user = await collection.findOne({ _id: new ObjectId(userId) });
    
    if (!user || !user.twoFactorSecret) {
      throw new Error('2FA setup not found');
    }

    // Verify the token
    const isValid = this.verify2FAToken(user.twoFactorSecret, token);
    if (!isValid) {
      throw new Error('Invalid 2FA token');
    }

    // Enable 2FA
    await collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { twoFactorEnabled: true } }
    );

    return true;
  }

  async disable2FA(userId: string, token: string): Promise<boolean> {
    const collection = await this.getCollection();
    const user = await collection.findOne({ _id: new ObjectId(userId) });
    
    if (!user || !user.twoFactorEnabled) {
      throw new Error('2FA not enabled');
    }

    // Verify the token or backup code
    const isValidToken = this.verify2FAToken(user.twoFactorSecret!, token);
    const isValidBackupCode = user.twoFactorBackupCodes?.includes(token);
    
    if (!isValidToken && !isValidBackupCode) {
      throw new Error('Invalid 2FA token');
    }

    // Disable 2FA and clear secrets
    await collection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { twoFactorEnabled: false },
        $unset: { 
          twoFactorSecret: "",
          twoFactorBackupCodes: ""
        }
      }
    );

    return true;
  }

  verify2FAToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow some time drift
    });
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }
} 