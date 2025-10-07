/**
 * MongoDB connection utility
 * Handles connection pooling and ensures single connection in development
 * SERVER-SIDE ONLY
 */
import mongoose from 'mongoose';

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/concierge';

// Server-side only check
if (typeof window === 'undefined' && !MONGODB_URI) {
  throw new Error('Please define the DATABASE_URL environment variable');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached: MongooseCache;

// Only run on server
if (typeof window === 'undefined') {
  if (!(global as any).mongoose) {
    (global as any).mongoose = { conn: null, promise: null };
  }
  cached = (global as any).mongoose;
} else {
  // Browser context - create dummy cache
  cached = { conn: null, promise: null };
}

export async function connectDB() {
  // Only connect on server
  if (typeof window !== 'undefined') {
    throw new Error('connectDB should only be called on the server');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;

