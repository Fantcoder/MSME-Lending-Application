/**
 * Scoring Model — Credit Decision Scoring for MSME Lending
 *
 * Total Score: 100 points across 5 dimensions.
 * Each scoring function returns { score, flags } where flags are risk indicators.
 *
 * ┌─────────────────────────────────┬────────────┐
 * │ Dimension                       │ Max Points │
 * ├─────────────────────────────────┼────────────┤
 * │ A. Revenue-to-EMI Ratio         │ 30         │
 * │ B. Loan-to-Revenue Multiple     │ 30         │
 * │ C. Tenure Risk                  │ 20         │
 * │ D. Business Type                │ 10         │
 * │ E. Fraud & Consistency Check    │ 10         │
 * └─────────────────────────────────┴────────────┘
 *
 * Decision Rule:
 *   Score >= 60 → APPROVED
 *   Score <  60 → REJECTED
 *   Score >  80 && APPROVED → add STRONG_PROFILE reason code
 */

/**
 * A) Revenue-to-EMI Ratio — 30 points
 *
 * Measures what percentage of monthly revenue goes toward EMI.
 * Lower EMI burden signals healthier cash flow for the MSME.
 *
 * Thresholds:
 *   EMI < 30% of revenue  → 30 pts
 *   EMI 30–50% of revenue → 20 pts
 *   EMI 50–70% of revenue → 10 pts
 *   EMI > 70% of revenue  → 0 pts + HIGH_EMI_BURDEN flag
 *
 * @param {number} emi - Monthly EMI in INR
 * @param {number} monthlyRevenue - Monthly revenue in INR
 * @returns {{ score: number, flags: string[] }}
 */
const scoreRevenueToEMI = (emi, monthlyRevenue) => {
  const ratio = emi / monthlyRevenue;
  const flags = [];

  if (ratio < 0.3) {
    return { score: 30, flags };
  }
  if (ratio <= 0.5) {
    return { score: 20, flags };
  }
  if (ratio <= 0.7) {
    return { score: 10, flags };
  }

  flags.push('HIGH_EMI_BURDEN');
  return { score: 0, flags };
};

/**
 * B) Loan-to-Monthly-Revenue Multiple — 30 points
 *
 * Measures the loan amount as a multiple of monthly revenue.
 * A lower multiple indicates the borrower can realistically service the debt.
 *
 * Thresholds:
 *   Loan < 6x revenue   → 30 pts
 *   Loan 6x–12x revenue → 20 pts
 *   Loan 12x–18x revenue→ 10 pts
 *   Loan > 18x revenue  → 0 pts + HIGH_LOAN_RATIO flag
 *
 * @param {number} loanAmount - Loan principal in INR
 * @param {number} monthlyRevenue - Monthly revenue in INR
 * @returns {{ score: number, flags: string[] }}
 */
const scoreLoanToRevenue = (loanAmount, monthlyRevenue) => {
  const multiple = loanAmount / monthlyRevenue;
  const flags = [];

  if (multiple < 6) {
    return { score: 30, flags };
  }
  if (multiple <= 12) {
    return { score: 20, flags };
  }
  if (multiple <= 18) {
    return { score: 10, flags };
  }

  flags.push('HIGH_LOAN_RATIO');
  return { score: 0, flags };
};

/**
 * C) Tenure Risk — 20 points
 *
 * Shorter and extremely long tenures carry higher risk.
 * The sweet spot for MSME loans is 12–48 months.
 *
 * Thresholds:
 *   12–48 months        → 20 pts
 *   6–11 or 49–60 months→ 12 pts
 *   3–5 or 61–84 months → 5 pts + TENURE_RISK flag
 *
 * @param {number} tenureMonths - Loan tenure in months
 * @returns {{ score: number, flags: string[] }}
 */
const scoreTenure = (tenureMonths) => {
  const flags = [];

  if (tenureMonths >= 12 && tenureMonths <= 48) {
    return { score: 20, flags };
  }
  if ((tenureMonths >= 6 && tenureMonths <= 11) || (tenureMonths >= 49 && tenureMonths <= 60)) {
    return { score: 12, flags };
  }

  flags.push('TENURE_RISK');
  return { score: 5, flags };
};

/**
 * D) Business Type — 10 points
 *
 * Business type acts as a proxy for stability and formalization.
 * Manufacturing and services firms typically have more predictable revenue streams.
 *
 * Scoring:
 *   manufacturing | services → 10 pts
 *   retail                   → 7 pts
 *   other                    → 4 pts
 *
 * @param {string} businessType - One of: manufacturing, services, retail, other
 * @returns {{ score: number, flags: string[] }}
 */
const scoreBusinessType = (businessType) => {
  const typeScores = {
    manufacturing: 10,
    services: 10,
    retail: 7,
    other: 4,
  };

  return {
    score: typeScores[businessType] || 4,
    flags: [],
  };
};

/**
 * E) Fraud & Consistency Check — 10 points
 *
 * Basic sanity checks on application data to catch inconsistencies.
 * These are not ML-based fraud signals but simple threshold-based heuristics.
 *
 * Rules (evaluated in order, worst flag takes precedence):
 *   Loan > 50x monthly revenue → 0 pts + DATA_INCONSISTENCY flag
 *   Monthly revenue < ₹10,000  → 0 pts + LOW_REVENUE flag
 *   No red flags               → 10 pts
 *
 * @param {number} loanAmount - Loan principal in INR
 * @param {number} monthlyRevenue - Monthly revenue in INR
 * @returns {{ score: number, flags: string[] }}
 */
const scoreFraudCheck = (loanAmount, monthlyRevenue) => {
  const flags = [];
  let score = 10;

  if (loanAmount > 50 * monthlyRevenue) {
    flags.push('DATA_INCONSISTENCY');
    score = 0;
  }

  if (monthlyRevenue < 10000) {
    flags.push('LOW_REVENUE');
    score = 0;
  }

  return { score, flags };
};

/**
 * Run the full scoring model and produce a credit decision.
 *
 * @param {object} params
 * @param {number} params.emi - Calculated monthly EMI
 * @param {number} params.loanAmount - Loan principal in INR
 * @param {number} params.monthlyRevenue - Monthly revenue in INR
 * @param {number} params.tenureMonths - Loan tenure in months
 * @param {string} params.businessType - Business type enum value
 * @returns {{ decision: string, creditScore: number, reasonCodes: string[] }}
 */
const evaluate = ({ emi, loanAmount, monthlyRevenue, tenureMonths, businessType }) => {
  const dimensions = [
    scoreRevenueToEMI(emi, monthlyRevenue),
    scoreLoanToRevenue(loanAmount, monthlyRevenue),
    scoreTenure(tenureMonths),
    scoreBusinessType(businessType),
    scoreFraudCheck(loanAmount, monthlyRevenue),
  ];

  const creditScore = dimensions.reduce((sum, d) => sum + d.score, 0);
  const reasonCodes = dimensions.flatMap((d) => d.flags);

  const decision = creditScore >= 60 ? 'APPROVED' : 'REJECTED';

  if (decision === 'APPROVED' && creditScore > 80) {
    reasonCodes.push('STRONG_PROFILE');
  }

  // Guarantee at least one reason code for every decision
  if (reasonCodes.length === 0) {
    reasonCodes.push(decision === 'APPROVED' ? 'STRONG_PROFILE' : 'HIGH_EMI_BURDEN');
  }

  return { 
    decision, 
    creditScore, 
    reasonCodes: [...new Set(reasonCodes)]
  };
};

module.exports = {
  evaluate,
  scoreRevenueToEMI,
  scoreLoanToRevenue,
  scoreTenure,
  scoreBusinessType,
  scoreFraudCheck,
};
