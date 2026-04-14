const db = require('../db/pg');

/**
 * Insert a new loan application.
 * @param {object} data
 * @param {string} data.profileId
 * @param {number} data.loanAmount
 * @param {number} data.tenureMonths
 * @param {string} data.purpose
 * @param {number} data.estimatedEmi
 * @returns {Promise<object>} The inserted row
 */
const create = async ({ profileId, loanAmount, tenureMonths, purpose, estimatedEmi }) => {
  const { rows } = await db.query(
    `INSERT INTO loan_applications (profile_id, loan_amount, tenure_months, purpose, estimated_emi, status)
     VALUES ($1, $2, $3, $4, $5, 'PENDING')
     RETURNING id, profile_id, loan_amount, tenure_months, purpose, estimated_emi, status, created_at`,
    [profileId, loanAmount, tenureMonths, purpose, estimatedEmi]
  );
  return rows[0];
};

/**
 * Find a loan application by its UUID.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
const findById = async (id) => {
  const { rows } = await db.query(
    `SELECT la.id, la.profile_id, la.loan_amount, la.tenure_months, la.purpose,
            la.estimated_emi, la.status, la.created_at,
            bp.owner_name, bp.pan, bp.business_type, bp.monthly_revenue
     FROM loan_applications la
     JOIN business_profiles bp ON bp.id = la.profile_id
     WHERE la.id = $1`,
    [id]
  );
  return rows[0] || null;
};

/**
 * Update the status of a loan application.
 * @param {string} id
 * @param {string} status - PENDING | PROCESSING | APPROVED | REJECTED
 * @returns {Promise<object>}
 */
const updateStatus = async (id, status) => {
  const { rows } = await db.query(
    `UPDATE loan_applications SET status = $1 WHERE id = $2
     RETURNING id, status`,
    [status, id]
  );
  return rows[0];
};

module.exports = { create, findById, updateStatus };
