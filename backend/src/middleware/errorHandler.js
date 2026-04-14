/**
 * Global Error Handler — Last Express middleware in the chain.
 *
 * Responsibilities:
 * 1. Maps known error types to appropriate HTTP status codes
 * 2. Returns the standard { success: false, error: { ... } } format
 * 3. Never exposes stack traces in production (checks NODE_ENV)
 * 4. Logs errors for observability
 */

/* eslint-disable no-unused-vars */
const errorHandler = (err, req, res, _next) => {
  // Log the error for server-side observability
  console.error(`[ErrorHandler] ${err.message}`, {
    method: req.method,
    path: req.originalUrl,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });

  // Determine status code from error properties or defaults
  let statusCode = err.statusCode || err.status || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred';

  // Map specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  } else if (err.name === 'CastError' || err.name === 'SyntaxError') {
    statusCode = 400;
    code = 'BAD_REQUEST';
    message = 'Invalid request format';
  } else if (err.code === '23505') {
    // PostgreSQL unique constraint violation
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'A record with this data already exists';
  } else if (err.code === '23503') {
    // PostgreSQL foreign key violation
    statusCode = 400;
    code = 'REFERENCE_ERROR';
    message = 'Referenced record does not exist';
  }

  // Never expose internal details in production
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: isProduction && statusCode === 500
        ? 'An unexpected error occurred'
        : message,
      ...(!isProduction && err.stack && { stack: err.stack }),
    },
  });
};
/* eslint-enable no-unused-vars */

module.exports = errorHandler;
