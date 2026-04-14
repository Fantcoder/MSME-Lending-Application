const { Router } = require('express');
const { validateDecisionEvaluate, validateApplicationIdParam } = require('../middleware/validate');
const { decisionRateLimiter } = require('../middleware/rateLimiter');
const { evaluate, getStatus } = require('../controllers/decisionController');

const router = Router();

/**
 * POST /api/v1/decision/evaluate
 * Initiate asynchronous credit decision processing.
 * Rate limited: 10 requests per minute per IP.
 */
router.post('/evaluate', decisionRateLimiter, validateDecisionEvaluate, evaluate);

/**
 * GET /api/v1/decision/status/:applicationId
 * Poll for decision processing status.
 */
router.get('/status/:applicationId', validateApplicationIdParam, getStatus);

module.exports = router;
