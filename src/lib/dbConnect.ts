// src/lib/dbConnect.ts
import mongoose from "mongoose";

// Use a global cache (important in dev with hot reload)
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  // ✅ Reuse cached connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // ✅ Ensure URI is set
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("❌ MONGODB_URI is missing in environment variables");
  }

  // ✅ If no ongoing connection, create one
  if (!cached.promise) {
    const options: mongoose.ConnectOptions = {
      // ✅ Disable command buffering to avoid accidental unhandled queries
      bufferCommands: false,
      // ✅ Better timeouts
      serverSelectionTimeoutMS: 30000, // fail fast if cannot connect in 30s
      socketTimeoutMS: 45000, // close idle sockets after 45s
      // ✅ Recommended in production (prevents deprecation warnings)
      family: 4, // force IPv4 (avoid IPv6 issues on some hosts)
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, options)
      .then((mongooseInstance) => {
        if (mongoose.connection.readyState === 1) {
          
        }
        return mongooseInstance;
      })
      .catch((err) => {
        console.error("❌ MongoDB connection failed:", err.message);
        throw err;
      });
  }

  // ✅ Wait for the cached connection
  cached.conn = await cached.promise;
  return cached.conn;
}
