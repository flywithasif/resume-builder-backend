import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI environment variable is missing.",
  );
}

const globalForMongo = globalThis;

if (!globalForMongo.__mongoose) {
  globalForMongo.__mongoose = {
    promise: null,
  };
}

const cached = globalForMongo.__mongoose;

/*
|--------------------------------------------------------------------------
| Connect MongoDB
|--------------------------------------------------------------------------
*/

export async function connectDB() {
  /*
  |--------------------------------------------------------------------------
  | Already Connected
  |--------------------------------------------------------------------------
  */

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  /*
  |--------------------------------------------------------------------------
  | Existing Connection
  |--------------------------------------------------------------------------
  */

  if (cached.promise) {
    return cached.promise;
  }

  /*
  |--------------------------------------------------------------------------
  | Create Connection
  |--------------------------------------------------------------------------
  */

  cached.promise = mongoose
    .connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      bufferCommands: false,
    })
    .then(() => {
      console.log(
        "MongoDB connected successfully.",
      );

      return mongoose.connection;
    })
    .catch((error) => {
      cached.promise = null;

      console.error(
        "MongoDB connection failed:",
        error.message,
      );

      throw error;
    });

  return cached.promise;
}