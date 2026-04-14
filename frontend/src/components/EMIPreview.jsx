import { calculateEMI, formatINR } from '../utils/emiCalculator';

/**
 * EMIPreview — Shows estimated monthly EMI in real-time
 * as the user fills in loan amount and tenure fields.
 * Only renders when both values are present and valid.
 */
export default function EMIPreview({ loanAmount, tenureMonths }) {
  const emi = calculateEMI(loanAmount, tenureMonths);

  if (emi === null) return null;

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-input px-4 py-3">
      <p className="text-sm text-label">Estimated EMI</p>
      <p className="text-lg font-semibold text-primary mt-0.5">
        {formatINR(emi)}
        <span className="text-sm font-normal text-label ml-1">/month</span>
      </p>
    </div>
  );
}
