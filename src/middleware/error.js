export function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err, req, res, next) {
  console.error("SERVER ERROR:", err);

  /*
  |--------------------------------------------------------------------------
  | Duplicate MongoDB Key
  |--------------------------------------------------------------------------
  */

  if (err?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists.",
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Mongoose Validation Error
  |--------------------------------------------------------------------------
  */

  if (err?.name === "ValidationError") {
    const messages = Object.values(err.errors)
      .map((item) => item.message)
      .join(", ");

    return res.status(400).json({
      success: false,
      message: messages || "Validation failed.",
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Default Error
  |--------------------------------------------------------------------------
  */

  const statusCode = err?.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Something went wrong on the server."
        : err.message,
  });
}