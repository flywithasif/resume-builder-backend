import "dotenv/config";

import app from "./app.js";

import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

async function startServer() {
  try {
    /*
    |--------------------------------------------------------------------------
    | Connect MongoDB
    |--------------------------------------------------------------------------
    */

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | Start Express
    |--------------------------------------------------------------------------
    */

    app.listen(PORT, () => {
      console.log(
        `Resume Builder API running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Server startup failed:",
      error.message
    );

    process.exit(1);
  }
}

startServer();