/**
 * Human-readable descriptions for each reason code.
 */
const REASON_LABELS = {
  LOW_REVENUE: 'Monthly revenue too low',
  HIGH_LOAN_RATIO: 'Loan amount too high relative to revenue',
  HIGH_EMI_BURDEN: 'EMI exceeds safe income threshold',
  TENURE_RISK: 'Loan tenure is outside optimal range',
  DATA_INCONSISTENCY: 'Loan amount is disproportionate to stated revenue',
  STRONG_PROFILE: 'Strong financial profile detected',
};

/**
 * ReasonChip — Small pill/chip tag showing a reason code
 * and its human-readable description.
 */
export default function ReasonChip({ code }) {
  const label = REASON_LABELS[code] || code;
  const isPositive = code === 'STRONG_PROFILE';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
        ${isPositive
          ? 'bg-green-50 text-success border border-green-200'
          : 'bg-red-50 text-error border border-red-200'
        }`}
    >
      <span className="font-semibold">{code}</span>
      <span className="text-label">—</span>
      <span>{label}</span>
    </span>
  );
}
