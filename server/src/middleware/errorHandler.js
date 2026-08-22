/**
 * Global centralized error handling middleware
 */
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] [${req.method} ${req.originalUrl}]:`, err);

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
  });
}

/**
 * 404 Route Not Found middleware
 */
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      statusCode: 404,
    },
  });
}
