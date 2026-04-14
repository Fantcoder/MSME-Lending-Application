import StatusBadge from './StatusBadge';
import ReasonChip from './ReasonChip';
import { formatINR } from '../utils/emiCalculator';

/**
 * DecisionResult — Full result view replacing the form after decision is received.
 * Shows status badge, credit score bar, reason codes, EMI, and reset button.
 */
export default function DecisionResult({ result, onReset }) {
  const { decision, creditScore, reasonCodes, estimatedEMI, processingMs } = result;

  // Score bar width percentage
  const scorePercent = Math.min(Math.max(creditScore, 0), 100);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Status Badge */}
      <StatusBadge decision={decision} />

      {/* Credit Score */}
      <div className="bg-white rounded-card border border-border shadow-card p-5">
        <p className="text-sm font-medium text-label mb-2">Credit Score</p>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-heading">{creditScore}</span>
          <span className="text-sm text-label">/ 100</span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${scorePercent}%` }}
          />
        </div>
      </div>

      {/* Reason Codes */}
      <div className="bg-white rounded-card border border-border shadow-card p-5">
        <p className="text-sm font-medium text-label mb-3">Reason Codes</p>
        <div className="flex flex-wrap gap-2">
          {reasonCodes.map((code) => (
            <ReasonChip key={code} code={code} />
          ))}
        </div>
      </div>

      {/* EMI & Processing Info */}
      <div className="bg-white rounded-card border border-border shadow-card p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-label">Estimated EMI</p>
            <p className="text-lg font-semibold text-heading mt-0.5">
              {formatINR(estimatedEMI)}
              <span className="text-sm font-normal text-label ml-1">/ month</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-label">Processing Time</p>
            <p className="text-lg font-semibold text-heading mt-0.5">
              {processingMs}
              <span className="text-sm font-normal text-label ml-1">ms</span>
            </p>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <button
        id="btn-new-application"
        onClick={onReset}
        className="w-full py-3 text-sm font-medium text-primary bg-white border border-primary
                   rounded-input hover:bg-blue-50 transition-colors"
      >
        Start New Application
      </button>
    </div>
  );
}
