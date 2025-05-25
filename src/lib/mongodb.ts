import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tennisApp';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

interface MongoConnection {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
}

let cached: MongoConnection = { client: null, promise: null };

export async function connectToDatabase() {
  if (cached.client) {
    return cached.client;
  }

  if (!cached.promise) {
    cached.promise = MongoClient.connect(MONGODB_URI);
  }

  try {
    cached.client = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.client;
}

export async function getCollection(name: string) {
  const client = await connectToDatabase();
  const db = client.db();
  return db.collection(name);
}

export default connectToDatabase; 