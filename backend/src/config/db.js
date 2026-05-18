import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDb = async () => {
  await mongoose.connect(env.mongoUri, {
    dbName: env.mongoDbName
  });
  console.log("Connected to MongoDB");
};