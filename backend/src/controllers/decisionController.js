const ApplicationModel = require('../models/application');
const DecisionModel = require('../models/decision');
const decisionEngine = require('../services/decisionEngine');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * POST /api/v1/decision/evaluate
 *
 * Initiates asynchronous credit decision processing.
 * Returns immediately with a PROCESSING status and a poll URL.
 * The actual scoring runs in the background via decisionEngine.
 */
const evaluate = asyncHandler(async (req, res) => {
  const { applicationId } = req.body;

  // Verify the application exists
  const application = await ApplicationModel.findById(applicationId);
  if (!application) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'APPLICATION_NOT_FOUND',
        message: `Loan application with id ${applicationId} does not exist`,
      },
    });
  }

  // Prevent re-evaluation of already processed applications
  if (application.status !== 'PENDING') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'ALREADY_PROCESSED',
        message: `Application ${applicationId} is already in status: ${application.status}`,
      },
    });
  }

  // Mark as PROCESSING before kicking off background work
  await ApplicationModel.updateStatus(applicationId, 'PROCESSING');

  // Fire-and-forget: decision engine processes asynchronously
  decisionEngine.processDecision(applicationId);

  res.status(202).json({
    success: true,
    data: {
      applicationId,
      status: 'PROCESSING',
      pollUrl: `/api/v1/decision/status/${applicationId}`,
    },
  });
});

/**
 * GET /api/v1/decision/status/:applicationId
 *
 * Returns the current processing status and decision result if complete.
 * Frontend polls this endpoint every 2 seconds until status is COMPLETE.
 */
const getStatus = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  // Check if a decision has been recorded
  const decision = await DecisionModel.findByApplicationId(applicationId);

  if (decision) {
    return res.status(200).json({
      success: true,
      data: {
        applicationId: decision.application_id,
        status: 'COMPLETE',
        decision: {
          applicationId: decision.application_id,
          decision: decision.decision,
          creditScore: decision.credit_score,
          reasonCodes: decision.reason_codes,
          estimatedEMI: parseFloat(decision.estimated_emi),
          processingMs: decision.processing_ms,
        },
      },
    });
  }

  // No decision yet — check if application exists and is being processed
  const application = await ApplicationModel.findById(applicationId);
  if (!application) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'APPLICATION_NOT_FOUND',
        message: `Loan application with id ${applicationId} does not exist`,
      },
    });
  }

  res.status(200).json({
    success: true,
    data: {
      applicationId,
      status: 'PROCESSING',
    },
  });
});

module.exports = { evaluate, getStatus };
