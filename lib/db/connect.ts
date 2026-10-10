import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

type Cache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  _fbMongoose?: Cache;
};

const cache: Cache =
  globalWithMongoose._fbMongoose || (globalWithMongoose._fbMongoose = { conn: null, promise: null });

export function isDbConfigured(): boolean {
  return Boolean(MONGODB_URI && /^mongodb(\+srv)?:\/\//.test(MONGODB_URI));
}

export async function connectDb() {
  if (!isDbConfigured()) {
    throw new Error("MONGODB_URI is not configured");
  }
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    mongoose.set("strictQuery", true);
    cache.promise = mongoose.connect(MONGODB_URI as string, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 10,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
  return cache.conn;
}
