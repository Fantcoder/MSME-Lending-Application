import {
  validateLoanAmount,
  validateTenureMonths,
  validatePurpose,
} from '../utils/validators';
import EMIPreview from './EMIPreview';

/**
 * LoanForm — Section B of the lending application form.
 * Collects loan details and shows a live EMI preview.
 */
export default function LoanForm({ formData, onChange, errors, setFieldError }) {
  const handleBlur = (field, validator) => {
    const error = validator(formData[field]);
    setFieldError(field, error);
  };

  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-heading">Loan Details</h2>

      {/* Loan Amount */}
      <div>
        <label htmlFor="loanAmount" className="block text-sm font-medium text-label mb-1.5">
          Loan Amount (₹)
        </label>
        <input
          id="loanAmount"
          type="number"
          value={formData.loanAmount}
          onChange={(e) => onChange('loanAmount', e.target.value)}
          onBlur={() => handleBlur('loanAmount', validateLoanAmount)}
          placeholder="e.g. 1000000"
          min="1"
          className={`w-full px-3 py-2.5 text-sm border rounded-input outline-none transition-colors
            ${errors.loanAmount ? 'border-error' : 'border-border focus:border-primary'}`}
        />
        {errors.loanAmount && (
          <p className="mt-1 text-xs text-error">{errors.loanAmount}</p>
        )}
      </div>

      {/* Tenure in Months */}
      <div>
        <label htmlFor="tenureMonths" className="block text-sm font-medium text-label mb-1.5">
          Tenure (Months)
        </label>
        <input
          id="tenureMonths"
          type="number"
          value={formData.tenureMonths}
          onChange={(e) => onChange('tenureMonths', e.target.value)}
          onBlur={() => handleBlur('tenureMonths', validateTenureMonths)}
          placeholder="e.g. 36"
          min="3"
          max="84"
          className={`w-full px-3 py-2.5 text-sm border rounded-input outline-none transition-colors
            ${errors.tenureMonths ? 'border-error' : 'border-border focus:border-primary'}`}
        />
        <p className="mt-1 text-xs text-label">Between 3 and 84 months</p>
        {errors.tenureMonths && (
          <p className="mt-0.5 text-xs text-error">{errors.tenureMonths}</p>
        )}
      </div>

      {/* Purpose of Loan */}
      <div>
        <label htmlFor="purpose" className="block text-sm font-medium text-label mb-1.5">
          Purpose of Loan
        </label>
        <textarea
          id="purpose"
          value={formData.purpose}
          onChange={(e) => onChange('purpose', e.target.value)}
          onBlur={() => handleBlur('purpose', validatePurpose)}
          placeholder="Describe the purpose of this loan (min 10 characters)"
          rows={3}
          className={`w-full px-3 py-2.5 text-sm border rounded-input outline-none transition-colors resize-none
            ${errors.purpose ? 'border-error' : 'border-border focus:border-primary'}`}
        />
        {errors.purpose && (
          <p className="mt-1 text-xs text-error">{errors.purpose}</p>
        )}
      </div>

      {/* EMI Preview — shown when both loanAmount and tenureMonths are filled */}
      <EMIPreview
        loanAmount={formData.loanAmount}
        tenureMonths={formData.tenureMonths}
      />
    </div>
  );
}
