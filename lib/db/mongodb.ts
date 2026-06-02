import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// Skip DB connection during build
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                    process.env.npm_lifecycle_event === 'build';

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  // During build time, return null without error
  if (isBuildTime || !MONGODB_URI || MONGODB_URI.includes('placeholder')) {
    console.log('Skipping database connection during build');
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('MongoDB connected successfully');
      return mongoose;
    }).catch((err) => {
      console.error('MongoDB connection error:', err);
      return null;
    });
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}

// Add this export
export async function isDBConnected() {
  if (isBuildTime) return false;
  try {
    const conn = await connectDB();
    return conn !== null && conn.connection.readyState === 1;
  } catch (error) {
    return false;
  }
}