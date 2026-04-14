/**
 * Client-side form validators.
 * Each validator returns an error message string, or empty string if valid.
 */

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export const validateOwnerName = (value) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return 'Owner name is required';
  if (trimmed.length < 2) return 'Owner name must be at least 2 characters';
  if (trimmed.length > 100) return 'Owner name must not exceed 100 characters';
  return '';
};

export const validatePAN = (value) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return 'PAN number is required';
  if (!PAN_REGEX.test(trimmed)) return 'PAN must match format: ABCDE1234F';
  return '';
};

export const validateBusinessType = (value) => {
  if (!value) return 'Business type is required';
  const allowed = ['retail', 'manufacturing', 'services', 'other'];
  if (!allowed.includes(value)) return 'Invalid business type';
  return '';
};

export const validateMonthlyRevenue = (value) => {
  const num = parseFloat(value);
  if (!value && value !== 0) return 'Monthly revenue is required';
  if (isNaN(num) || num <= 0) return 'Monthly revenue must be a positive number';
  return '';
};

export const validateLoanAmount = (value) => {
  const num = parseFloat(value);
  if (!value && value !== 0) return 'Loan amount is required';
  if (isNaN(num) || num <= 0) return 'Loan amount must be a positive number';
  return '';
};

export const validateTenureMonths = (value) => {
  const num = parseInt(value, 10);
  if (!value && value !== 0) return 'Tenure is required';
  if (isNaN(num) || num < 3 || num > 84) return 'Tenure must be between 3 and 84 months';
  if (!Number.isInteger(parseFloat(value))) return 'Tenure must be a whole number';
  return '';
};

export const validatePurpose = (value) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return 'Purpose is required';
  if (trimmed.length < 10) return 'Purpose must be at least 10 characters';
  if (trimmed.length > 500) return 'Purpose must not exceed 500 characters';
  return '';
};

/**
 * Validate all form fields at once. Returns an object with field keys → error messages.
 * Only fields with errors are included.
 */
export const validateAllFields = (formData) => {
  const errors = {};

  const checks = {
    ownerName: validateOwnerName(formData.ownerName),
    pan: validatePAN(formData.pan),
    businessType: validateBusinessType(formData.businessType),
    monthlyRevenue: validateMonthlyRevenue(formData.monthlyRevenue),
    loanAmount: validateLoanAmount(formData.loanAmount),
    tenureMonths: validateTenureMonths(formData.tenureMonths),
    purpose: validatePurpose(formData.purpose),
  };

  for (const [field, msg] of Object.entries(checks)) {
    if (msg) errors[field] = msg;
  }

  return errors;
};
