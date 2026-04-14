const ProfileModel = require('../models/profile');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * POST /api/v1/business/profile
 *
 * Creates a new business profile in PostgreSQL.
 * Validation is handled by middleware before this controller is reached.
 */
const createProfile = asyncHandler(async (req, res) => {
  const { ownerName, pan, businessType, monthlyRevenue } = req.body;

  const row = await ProfileModel.create({
    ownerName,
    pan,
    businessType,
    monthlyRevenue,
  });

  res.status(201).json({
    success: true,
    data: {
      profileId: row.id,
      ownerName: row.owner_name,
      businessType: row.business_type,
      monthlyRevenue: parseFloat(row.monthly_revenue),
    },
  });
});

module.exports = { createProfile };
