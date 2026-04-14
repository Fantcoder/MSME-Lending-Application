const db = require('../db/pg');

/**
 * Insert a decision record.
 * @param {object} data
 * @param {string} data.applicationId
 * @param {string} data.decision - APPROVED | REJECTED
 * @param {number} data.creditScore - 0–100
 * @param {string[]} data.reasonCodes
 * @param {number} data.processingMs
 * @returns {Promise<object>} The inserted row
 */
const create = async ({ applicationId, decision, creditScore, reasonCodes, processingMs }) => {
  const { rows } = await db.query(
    `INSERT INTO decisions (application_id, decision, credit_score, reason_codes, processing_ms)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, application_id, decision, credit_score, reason_codes, processing_ms, created_at`,
    [applicationId, decision, creditScore, reasonCodes, processingMs]
  );
  return rows[0];
};

/**
 * Find a decision by its associated application ID.
 * @param {string} applicationId
 * @returns {Promise<object|null>}
 */
const findByApplicationId = async (applicationId) => {
  const { rows } = await db.query(
    `SELECT d.id, d.application_id, d.decision, d.credit_score, d.reason_codes,
            d.processing_ms, d.created_at, la.estimated_emi
     FROM decisions d
     JOIN loan_applications la ON la.id = d.application_id
     WHERE d.application_id = $1
     ORDER BY d.created_at DESC
     LIMIT 1`,
    [applicationId]
  );
  return rows[0] || null;
};

module.exports = { create, findByApplicationId };
