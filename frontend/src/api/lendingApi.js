import axios from 'axios';

/**
 * Axios instance configured for the MSME Lending API.
 * Uses Vite's proxy in development — all requests go to /api/v1/...
 * which Vite proxies to the backend server.
 */
const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

/**
 * Create a business profile.
 * @param {object} data - { ownerName, pan, businessType, monthlyRevenue }
 * @returns {Promise<object>} - { profileId, ownerName, businessType, monthlyRevenue }
 */
export const createBusinessProfile = async (data) => {
  const res = await api.post('/business/profile', data);
  return res.data.data;
};

/**
 * Submit a loan application.
 * @param {object} data - { profileId, loanAmount, tenureMonths, purpose }
 * @returns {Promise<object>} - { applicationId, estimatedEMI, loanAmount, tenureMonths }
 */
export const applyForLoan = async (data) => {
  const res = await api.post('/loan/apply', data);
  return res.data.data;
};

/**
 * Initiate decision evaluation.
 * @param {string} applicationId
 * @returns {Promise<object>} - { applicationId, status, pollUrl }
 */
export const evaluateDecision = async (applicationId) => {
  const res = await api.post('/decision/evaluate', { applicationId });
  return res.data.data;
};

/**
 * Poll decision status.
 * @param {string} applicationId
 * @returns {Promise<object>} - { applicationId, status, decision? }
 */
export const getDecisionStatus = async (applicationId) => {
  const res = await api.get(`/decision/status/${applicationId}`);
  return res.data.data;
};

/**
 * Extract a human-readable error message from an API error response.
 * @param {Error} err - Axios error
 * @returns {string}
 */
export const extractErrorMessage = (err) => {
  if (err.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  if (err.response?.data?.error?.details?.length) {
    return err.response.data.error.details.map((d) => d.message).join('. ');
  }
  if (err.message) {
    return err.message;
  }
  return 'An unexpected error occurred. Please try again.';
};

export default api;
