import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalCache = globalThis as unknown as { _mongoose?: MongooseCache };

const cached: MongooseCache = globalCache._mongoose ?? {
  conn: null,
  promise: null,
};
globalCache._mongoose = cached;

mongoose.set("strictQuery", true);

/**
 * Serverless-safe connection: one connection per lambda instance, cached on
 * `globalThis` so Next.js hot reloads and Fluid Compute instance reuse do not
 * open a new socket per request.
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn;

  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error("DATABASE_URL is not set");

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10_000,
        socketTimeoutMS: 45_000,
        family: 4,
      })
      .catch((err) => {
        // Clear the rejected promise so the next request can retry.
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
