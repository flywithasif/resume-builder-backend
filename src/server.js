import "dotenv/config";

import app from "./app.js";

import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

/*
|--------------------------------------------------------------------------
| Vercel / Serverless Handler
|--------------------------------------------------------------------------
*/

const handler = async (req, res) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | Connect MongoDB Before Handling Request
    |--------------------------------------------------------------------------
    */

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | Handle Express Request
    |--------------------------------------------------------------------------
    */

    return app(req, res);
  } catch (error) {
    console.error(
      "Serverless request error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Internal server error.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Local Development
|--------------------------------------------------------------------------
*/

if (process.env.VERCEL !== "1") {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(
          `Resume Builder API running on http://localhost:${PORT}`,
        );
      });
    })
    .catch((error) => {
      console.error(
        "Server startup failed:",
        error.message,
      );

      process.exit(1);
    });
}

/*
|--------------------------------------------------------------------------
| Export Serverless Handler
|--------------------------------------------------------------------------
*/

export default handler;