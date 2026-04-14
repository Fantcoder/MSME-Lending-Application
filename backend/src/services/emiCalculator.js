/**
 * EMI Calculator — Compound Interest (Reducing Balance) Method
 *
 * Formula: EMI = P × r × (1 + r)^n / ((1 + r)^n − 1)
 *
 * Where:
 *   P = Principal loan amount (INR)
 *   r = Monthly interest rate (annual rate / 12)
 *   n = Tenure in months
 *
 * Assumptions:
 *   - Fixed annual interest rate of 18% (common unsecured MSME lending rate in India)
 *   - Monthly compounding on reducing balance
 */

const ANNUAL_RATE = 0.18;
const MONTHLY_RATE = ANNUAL_RATE / 12; // 0.015

/**
 * Calculate EMI using the standard compound interest (reducing balance) formula.
 * @param {number} principal - Loan amount in INR (must be > 0)
 * @param {number} tenureMonths - Loan tenure in months (must be integer, 3–84)
 * @returns {number} Monthly EMI rounded to 2 decimal places
 */
const calculateEMI = (principal, tenureMonths) => {
  if (principal <= 0) {
    throw new Error('Principal must be greater than zero');
  }
  if (tenureMonths < 3 || tenureMonths > 84 || !Number.isInteger(tenureMonths)) {
    throw new Error('Tenure must be an integer between 3 and 84 months');
  }

  const r = MONTHLY_RATE;
  const n = tenureMonths;
  const compoundFactor = Math.pow(1 + r, n);

  const emi = (principal * r * compoundFactor) / (compoundFactor - 1);

  return Math.round(emi * 100) / 100;
};

module.exports = { calculateEMI, ANNUAL_RATE, MONTHLY_RATE };
