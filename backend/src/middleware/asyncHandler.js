/**
 * Async Handler Wrapper
 *
 * Wraps an async Express route handler to automatically catch
 * rejected promises and forward them to Express error handling middleware.
 *
 * Without this wrapper, unhandled promise rejections in async handlers
 * would crash the process or silently fail. This is a mandatory pattern
 * in Express 4.x (Express 5 handles this natively).
 *
 * Usage:
 *   router.post('/path', asyncHandler(async (req, res) => { ... }));
 *
 * @param {Function} fn - Async route handler function (req, res, next) => Promise
 * @returns {Function} Express-compatible route handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
