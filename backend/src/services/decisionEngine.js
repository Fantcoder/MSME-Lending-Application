const ApplicationModel = require('../models/application');
const DecisionModel = require('../models/decision');
const AuditLog = require('../models/auditLog');
const scoringModel = require('./scoringModel');

/**
 * Decision Engine — Orchestrates asynchronous credit evaluation.
 *
 * Simulates a real-world async processing pipeline:
 * 1. Marks the application as PROCESSING
 * 2. Waits 2–3 seconds (simulating bureau calls, ML inference, etc.)
 * 3. Runs the scoring model
 * 4. Persists the decision to PostgreSQL
 * 5. Logs the full audit trail to MongoDB
 * 6. Updates the application status to the final decision
 *
 * This async pattern decouples the API response from heavy computation,
 * enabling horizontal scaling via job queues in production (e.g., BullMQ).
 */

/**
 * Process a decision asynchronously for a given application.
 * This function is fire-and-forget from the controller's perspective.
 *
 * @param {string} applicationId - UUID of the loan application
 * @returns {void}
 */
const processDecision = (applicationId) => {
  // Random delay between 2000–3000ms to simulate real processing
  const delay = 2000 + Math.floor(Math.random() * 1000);

  setTimeout(async () => {
    const startTime = Date.now();

    try {
      const application = await ApplicationModel.findById(applicationId);

      if (!application) {
        console.error(`[DecisionEngine] Application ${applicationId} not found during processing`);
        return;
      }

      const emi = parseFloat(application.estimated_emi);
      const loanAmount = parseFloat(application.loan_amount);
      const monthlyRevenue = parseFloat(application.monthly_revenue);
      const tenureMonths = application.tenure_months;
      const businessType = application.business_type;

      // Run the scoring model (all logic lives in scoringModel.js)
      const { decision, creditScore, reasonCodes } = scoringModel.evaluate({
        emi,
        loanAmount,
        monthlyRevenue,
        tenureMonths,
        businessType,
      });

      const processingMs = Date.now() - startTime;

      // Persist decision to PostgreSQL
      await DecisionModel.create({
        applicationId,
        decision,
        creditScore,
        reasonCodes,
        processingMs,
      });

      // Update loan application status
      await ApplicationModel.updateStatus(applicationId, decision);

      // Write audit log to MongoDB
      await AuditLog.create({
        applicationId,
        timestamp: new Date(),
        inputSnapshot: {
          ownerName: application.owner_name,
          pan: application.pan,
          businessType,
          monthlyRevenue,
          loanAmount,
          tenureMonths,
          purpose: application.purpose,
          estimatedEmi: emi,
        },
        decision,
        score: creditScore,
        reasonCodes,
        processingMs,
      });

      console.log(
        `[DecisionEngine] Application ${applicationId}: ${decision} (score: ${creditScore}, ${processingMs}ms)`
      );
    } catch (err) {
      console.error(`[DecisionEngine] Error processing ${applicationId}:`, err.message);

      // Best-effort: mark the application as failed so polling doesn't hang
      try {
        await ApplicationModel.updateStatus(applicationId, 'REJECTED');
      } catch (updateErr) {
        console.error(`[DecisionEngine] Failed to update status for ${applicationId}:`, updateErr.message);
      }
    }
  }, delay);
};

module.exports = { processDecision };
