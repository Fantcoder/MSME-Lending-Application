const { body, param, validationResult } = require('express-validator');

/**
 * Validation Middleware — express-validator chains for each route.
 *
 * All field errors are collected and returned at once (not one at a time)
 * using the standard API error response format.
 */

// ─── Shared: run validation and return errors ────────────────────────────────

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));

    // Derive specific error codes from field-level failures
    const fieldCodes = {
      pan: 'INVALID_PAN',
      monthlyRevenue: 'INVALID_REVENUE',
    };

    const primaryField = details[0]?.field;
    const code = fieldCodes[primaryField] || 'VALIDATION_ERROR';

    return res.status(400).json({
      success: false,
      error: {
        code,
        message: 'Validation failed',
        details,
      },
    });
  }
  next();
};

// ─── Business Profile Validation ─────────────────────────────────────────────

const validateBusinessProfile = [
  body('ownerName')
    .trim()
    .notEmpty().withMessage('Owner name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Owner name must be between 2 and 100 characters'),

  body('pan')
    .trim()
    .notEmpty().withMessage('PAN is required')
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('PAN must match format: ABCDE1234F (5 letters, 4 digits, 1 letter)'),

  body('businessType')
    .trim()
    .isIn(['retail', 'manufacturing', 'services', 'other'])
    .withMessage('Business type must be one of: retail, manufacturing, services, other'),

  body('monthlyRevenue')
    .isFloat({ gt: 0 })
    .withMessage('Monthly revenue must be a positive number')
    .toFloat(),

  handleValidationErrors,
];

// ─── Loan Application Validation ─────────────────────────────────────────────

const validateLoanApplication = [
  body('profileId')
    .trim()
    .isUUID(4)
    .withMessage('profileId must be a valid UUID'),

  body('loanAmount')
    .isFloat({ gt: 0 })
    .withMessage('Loan amount must be a positive number')
    .toFloat(),

  body('tenureMonths')
    .isInt({ min: 3, max: 84 })
    .withMessage('Tenure must be an integer between 3 and 84 months')
    .toInt(),

  body('purpose')
    .trim()
    .notEmpty().withMessage('Purpose is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Purpose must be between 10 and 500 characters'),

  handleValidationErrors,
];

// ─── Decision Evaluate Validation ────────────────────────────────────────────

const validateDecisionEvaluate = [
  body('applicationId')
    .trim()
    .isUUID(4)
    .withMessage('applicationId must be a valid UUID'),

  handleValidationErrors,
];

// ─── Decision Status Param Validation ────────────────────────────────────────

const validateApplicationIdParam = [
  param('applicationId')
    .isUUID(4)
    .withMessage('applicationId must be a valid UUID'),

  handleValidationErrors,
];

module.exports = {
  validateBusinessProfile,
  validateLoanApplication,
  validateDecisionEvaluate,
  validateApplicationIdParam,
};
