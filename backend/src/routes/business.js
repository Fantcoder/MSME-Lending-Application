const { Router } = require('express');
const { validateBusinessProfile } = require('../middleware/validate');
const { createProfile } = require('../controllers/businessController');

const router = Router();

/**
 * POST /api/v1/business/profile
 * Create a new MSME business profile.
 */
router.post('/profile', validateBusinessProfile, createProfile);

module.exports = router;
