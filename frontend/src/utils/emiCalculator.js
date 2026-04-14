/**
 * Client-side EMI Calculator — mirrors the backend formula exactly.
 *
 * Formula: EMI = P × r × (1 + r)^n / ((1 + r)^n − 1)
 * Rate: 18% p.a. → 1.5% monthly
 */

const MONTHLY_RATE = 0.015;

/**
 * @param {number} principal - Loan amount in INR
 * @param {number} tenureMonths - Tenure in months (3–84)
 * @returns {number|null} Monthly EMI rounded to 2 decimals, or null if inputs invalid
 */
export const calculateEMI = (principal, tenureMonths) => {
  const p = parseFloat(principal);
  const n = parseInt(tenureMonths, 10);

  if (!p || p <= 0 || !n || n < 3 || n > 84) {
    return null;
  }

  const r = MONTHLY_RATE;
  const compoundFactor = Math.pow(1 + r, n);
  const emi = (p * r * compoundFactor) / (compoundFactor - 1);

  return Math.round(emi * 100) / 100;
};

/**
 * Format a number as Indian Rupees with comma-separated thousands.
 * @param {number} amount
 * @returns {string} e.g. "₹1,25,000"
 */
export const formatINR = (amount) => {
  if (amount == null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
