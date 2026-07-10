import mongoose from "mongoose";
import { logger } from "./logger";

let isConnected = false;

export async function connectMongo(): Promise<void> {
  const uri = process.env.MONGODB;
  if (!uri) {
    throw new Error("MONGODB environment variable is required but not set");
  }
  if (isConnected) return;
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: false,
  });
  isConnected = true;
  logger.info({ host: mongoose.connection.host }, "MongoDB connected");
}

export function getMongoStatus(): { connected: boolean; host: string | null } {
  return {
    connected: isConnected,
    host: isConnected ? (mongoose.connection.host ?? null) : null,
  };
}

export { mongoose };
