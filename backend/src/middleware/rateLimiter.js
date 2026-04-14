const rateLimit = require('express-rate-limit');

/**
 * Rate Limiter — Applied only to POST /api/v1/decision/evaluate
 *
 * Limits each IP to 10 requests per minute on the decision endpoint.
 * This prevents abuse of the computationally expensive scoring pipeline.
 *
 * In production, this would be backed by a Redis store for distributed
 * rate limiting across multiple server instances.
 */
const decisionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10,             // 10 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many decision requests. Please try again after 1 minute.',
      },
    });
  },
});

module.exports = { decisionRateLimiter };
