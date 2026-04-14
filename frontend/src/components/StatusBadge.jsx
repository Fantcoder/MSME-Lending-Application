/**
 * StatusBadge — Large decision status indicator.
 * Green left border + checkmark for APPROVED.
 * Red left border + cross for REJECTED.
 */
export default function StatusBadge({ decision }) {
  const isApproved = decision === 'APPROVED';

  return (
    <div
      className={`flex items-center gap-3 px-5 py-4 bg-white rounded-card border border-border
        ${isApproved ? 'border-l-4 border-l-success' : 'border-l-4 border-l-error'}`}
    >
      {/* Icon circle */}
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-full text-white text-lg font-bold flex-shrink-0
          ${isApproved ? 'bg-success' : 'bg-error'}`}
      >
        {isApproved ? '✓' : '✕'}
      </div>

      {/* Status text */}
      <div>
        <h2 className={`text-xl font-semibold ${isApproved ? 'text-success' : 'text-error'}`}>
          {isApproved ? 'Approved' : 'Rejected'}
        </h2>
        <p className="text-sm text-label mt-0.5">
          {isApproved
            ? 'Your loan application has been approved.'
            : 'Your loan application has been rejected.'}
        </p>
      </div>
    </div>
  );
}
