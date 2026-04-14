const db = require('../db/pg');

/**
 * Insert a new business profile into PostgreSQL.
 * @param {object} data
 * @param {string} data.ownerName
 * @param {string} data.pan
 * @param {string} data.businessType
 * @param {number} data.monthlyRevenue
 * @returns {Promise<object>} The inserted row
 */
const create = async ({ ownerName, pan, businessType, monthlyRevenue }) => {
  const { rows } = await db.query(
    `INSERT INTO business_profiles (owner_name, pan, business_type, monthly_revenue)
     VALUES ($1, $2, $3, $4)
     RETURNING id, owner_name, pan, business_type, monthly_revenue, created_at`,
    [ownerName, pan, businessType, monthlyRevenue]
  );
  return rows[0];
};

/**
 * Find a business profile by its UUID.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
const findById = async (id) => {
  const { rows } = await db.query(
    `SELECT id, owner_name, pan, business_type, monthly_revenue, created_at
     FROM business_profiles
     WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
};

module.exports = { create, findById };
