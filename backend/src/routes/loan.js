const { Router } = require('express');
const { validateLoanApplication } = require('../middleware/validate');
const { applyLoan } = require('../controllers/loanController');

const router = Router();

/**
 * POST /api/v1/loan/apply
 * Submit a new loan application linked to an existing business profile.
 */
router.post('/apply', validateLoanApplication, applyLoan);

module.exports = router;
