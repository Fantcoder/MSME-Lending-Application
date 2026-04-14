import { useState, useCallback } from 'react';
import Header from '../components/Header';
import BusinessForm from '../components/BusinessForm';
import LoanForm from '../components/LoanForm';
import DecisionResult from '../components/DecisionResult';
import ProgressSteps from '../components/ProgressSteps';
import { validateAllFields } from '../utils/validators';
import { formatINR } from '../utils/emiCalculator';
import {
  createBusinessProfile,
  applyForLoan,
  evaluateDecision,
  getDecisionStatus,
  extractErrorMessage,
} from '../api/lendingApi';

const INITIAL_FORM = {
  ownerName: '',
  pan: '',
  businessType: '',
  monthlyRevenue: '',
  loanAmount: '',
  tenureMonths: '',
  purpose: '',
};

/**
 * Home — Main page orchestrating the form → processing → result flow.
 */
export default function Home() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(null); // 'profile' | 'loan' | 'decision'
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [submittedData, setSubmittedData] = useState(null); // snapshot for result view

  // Update a single form field
  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setApiError('');
  }, []);

  // Set error for a single field (used by blur validation)
  const setFieldError = useCallback((field, message) => {
    setErrors((prev) => {
      if (!message) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return { ...prev, [field]: message };
    });
  }, []);

  // Poll decision status every 2 seconds until COMPLETE
  const pollForResult = useCallback(async (applicationId) => {
    const poll = async () => {
      try {
        const statusData = await getDecisionStatus(applicationId);

        if (statusData.status === 'COMPLETE') {
          setResult(statusData.decision);
          setProcessing(false);
          setCurrentStep(null);
          return;
        }

        setTimeout(poll, 2000);
      } catch (err) {
        setApiError(extractErrorMessage(err));
        setProcessing(false);
        setCurrentStep(null);
      }
    };

    poll();
  }, []);

  // Submit the full application flow
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const validationErrors = validateAllFields(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);

    // Save a snapshot for the result view
    setSubmittedData({
      ownerName: formData.ownerName.trim(),
      pan: formData.pan.trim().toUpperCase(),
      businessType: formData.businessType,
      monthlyRevenue: parseFloat(formData.monthlyRevenue),
      loanAmount: parseFloat(formData.loanAmount),
      tenureMonths: parseInt(formData.tenureMonths, 10),
      purpose: formData.purpose.trim(),
    });

    try {
      // Step 1: Create business profile
      setCurrentStep('profile');
      const profileData = await createBusinessProfile({
        ownerName: formData.ownerName.trim(),
        pan: formData.pan.trim().toUpperCase(),
        businessType: formData.businessType,
        monthlyRevenue: parseFloat(formData.monthlyRevenue),
      });

      // Step 2: Submit loan application
      setCurrentStep('loan');
      const loanData = await applyForLoan({
        profileId: profileData.profileId,
        loanAmount: parseFloat(formData.loanAmount),
        tenureMonths: parseInt(formData.tenureMonths, 10),
        purpose: formData.purpose.trim(),
      });

      // Step 3: Trigger decision evaluation
      setCurrentStep('decision');
      await evaluateDecision(loanData.applicationId);

      // Step 4: Begin polling
      setSubmitting(false);
      setProcessing(true);
      pollForResult(loanData.applicationId);
    } catch (err) {
      setApiError(extractErrorMessage(err));
      setSubmitting(false);
      setCurrentStep(null);
    }
  };

  // Reset everything for a new application
  const handleReset = () => {
    setFormData(INITIAL_FORM);
    setErrors({});
    setApiError('');
    setSubmitting(false);
    setCurrentStep(null);
    setProcessing(false);
    setResult(null);
    setSubmittedData(null);
  };

  // ─── Result View ─────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="min-h-screen bg-surface">
        <Header />
        <div className="max-w-[680px] mx-auto px-6 py-8">
          <header className="mb-6">
            <h1 className="text-lg font-bold text-heading">Application Result</h1>
            <p className="text-sm text-label mt-0.5">Credit evaluation complete</p>
          </header>

          {/* Application Summary */}
          {submittedData && (
            <div className="bg-white rounded-card border border-border shadow-card p-5 mb-6">
              <p className="text-xs font-semibold text-label uppercase tracking-wide mb-3">
                Application Summary
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                <div>
                  <span className="text-label">Applicant</span>
                  <p className="font-medium text-heading">{submittedData.ownerName}</p>
                </div>
                <div>
                  <span className="text-label">PAN</span>
                  <p className="font-medium text-heading">{submittedData.pan}</p>
                </div>
                <div>
                  <span className="text-label">Business Type</span>
                  <p className="font-medium text-heading capitalize">{submittedData.businessType}</p>
                </div>
                <div>
                  <span className="text-label">Monthly Revenue</span>
                  <p className="font-medium text-heading">{formatINR(submittedData.monthlyRevenue)}</p>
                </div>
                <div>
                  <span className="text-label">Loan Amount</span>
                  <p className="font-medium text-heading">{formatINR(submittedData.loanAmount)}</p>
                </div>
                <div>
                  <span className="text-label">Tenure</span>
                  <p className="font-medium text-heading">{submittedData.tenureMonths} months</p>
                </div>
              </div>
            </div>
          )}

          <DecisionResult result={result} onReset={handleReset} />
        </div>
      </div>
    );
  }

  // ─── Processing View ─────────────────────────────────────────────────────
  if (processing) {
    return (
      <div className="min-h-screen bg-surface">
        <Header />
        <div className="max-w-[680px] mx-auto px-6 py-8">
          <header className="mb-6">
            <h1 className="text-lg font-bold text-heading">MSME Lending Decision</h1>
            <p className="text-sm text-label mt-0.5">Credit evaluation in progress</p>
          </header>
          <div className="bg-white rounded-card border border-border shadow-card p-8 text-center">
            <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-heading">Processing your application...</p>
            <p className="text-xs text-label mt-1">This usually takes 2–3 seconds</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Form View ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <div className="max-w-[680px] mx-auto px-6 py-8">
        <header className="mb-6">
          <h1 className="text-lg font-bold text-heading">New Loan Application</h1>
          <p className="text-sm text-label mt-0.5">
            Submit your business profile and loan details for instant credit evaluation
          </p>
        </header>

        {/* API Error Notice */}
        {apiError && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-input">
            <p className="text-sm text-error">{apiError}</p>
          </div>
        )}

        {/* Step Progress — visible during submission */}
        {submitting && currentStep && (
          <div className="mb-5 bg-white rounded-card border border-border shadow-card px-6 py-4">
            <ProgressSteps currentStep={currentStep} />
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="bg-white rounded-card border border-border shadow-card">
            {/* Section A: Business Profile */}
            <div className="p-6">
              <BusinessForm
                formData={formData}
                onChange={handleChange}
                errors={errors}
                setFieldError={setFieldError}
              />
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Section B: Loan Details */}
            <div className="p-6">
              <LoanForm
                formData={formData}
                onChange={handleChange}
                errors={errors}
                setFieldError={setFieldError}
              />
            </div>

            {/* Submit */}
            <div className="px-6 pb-6">
              <button
                id="btn-submit-application"
                type="submit"
                disabled={submitting}
                className="w-full py-3 text-sm font-medium text-white bg-primary rounded-input
                           hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-[11px] text-label">
            18% p.a. fixed rate · EMI calculated on reducing balance · Decision in under 5 seconds
          </p>
        </footer>
      </div>
    </div>
  );
}
