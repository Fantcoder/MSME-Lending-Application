const ProfileModel = require('../models/profile');
const ApplicationModel = require('../models/application');
const { calculateEMI } = require('../services/emiCalculator');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * POST /api/v1/loan/apply
 *
 * Creates a new loan application linked to an existing business profile.
 * Computes EMI using the compound interest formula and persists to PostgreSQL.
 */
const applyLoan = asyncHandler(async (req, res) => {
  const { profileId, loanAmount, tenureMonths, purpose } = req.body;

  // Verify that the referenced business profile exists
  const profile = await ProfileModel.findById(profileId);
  if (!profile) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'PROFILE_NOT_FOUND',
        message: `Business profile with id ${profileId} does not exist`,
      },
    });
  }

  // Compute EMI using the reducing-balance compound interest formula
  const estimatedEmi = calculateEMI(loanAmount, tenureMonths);

  const row = await ApplicationModel.create({
    profileId,
    loanAmount,
    tenureMonths,
    purpose,
    estimatedEmi,
  });

  res.status(201).json({
    success: true,
    data: {
      applicationId: row.id,
      estimatedEMI: parseFloat(row.estimated_emi),
      loanAmount: parseFloat(row.loan_amount),
      tenureMonths: row.tenure_months,
    },
  });
});

module.exports = { applyLoan };
