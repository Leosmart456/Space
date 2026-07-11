import mongoose from "mongoose";

let mongoServer: any | null = null;

export async function connectDB() {
  try {
    let MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      const isVercel = !!process.env.VERCEL;
      if (isVercel) {
        throw new Error(
          "MONGODB_URI environment variable is not set. " +
          "Go to your Vercel project → Settings → Environment Variables and add MONGODB_URI pointing to your MongoDB Atlas cluster."
        );
      }

      console.log("No MONGODB_URI found, starting in-memory MongoDB replica set (supports transactions)...");
      const { MongoMemoryReplSet } = await import("mongodb-memory-server");
      mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
      await mongoServer.waitUntilRunning();
      MONGODB_URI = mongoServer.getUri();
      console.log("In-memory MongoDB replica set started at:", MONGODB_URI);
    }

    await mongoose.connect(MONGODB_URI!);
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (error) {
    console.error("MongoDB disconnection error:", error);
  }
}

export { mongoose };
