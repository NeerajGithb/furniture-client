// src/lib/dbConnect.ts
import mongoose from "mongoose";

let isConnected = false; // Track connection status

export async function connectDB() {
  if (isConnected) return;

  if (!process.env.MONGODB_URI) {
    throw new Error("❌ MONGODB_URI is missing in environment variables");
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "vfurniture", // Change if needed
      bufferCommands: false,
    });

    isConnected = true;
    console.log("✅ Connected to MongoDB");
  } catch (err: any) {
    console.error("❌ MongoDB connection failed:", err.message);
    throw new Error("MongoDB connection error");
  }
}
