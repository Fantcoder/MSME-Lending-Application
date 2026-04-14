/**
 * ProgressSteps — Shows the current stage during form submission.
 * Appears between "Submitting..." and the result.
 */

const STEPS = [
  { key: 'profile', label: 'Creating profile' },
  { key: 'loan', label: 'Submitting loan' },
  { key: 'decision', label: 'Evaluating credit' },
];

export default function ProgressSteps({ currentStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center gap-0 w-full">
      {STEPS.map((step, idx) => {
        const isDone = idx < currentIndex;
        const isActive = idx === currentIndex;
        const isPending = idx > currentIndex;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors
                  ${isDone ? 'bg-primary border-primary text-white' : ''}
                  ${isActive ? 'bg-white border-primary text-primary' : ''}
                  ${isPending ? 'bg-white border-border text-label' : ''}`}
              >
                {isDone ? '✓' : idx + 1}
              </div>
              <span
                className={`text-[11px] font-medium text-center
                  ${isDone ? 'text-primary' : ''}
                  ${isActive ? 'text-heading' : ''}
                  ${isPending ? 'text-label' : ''}`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div className="flex-1 mx-2">
                <div
                  className={`h-0.5 w-full rounded ${isDone ? 'bg-primary' : 'bg-border'}`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
