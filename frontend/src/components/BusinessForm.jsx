import { useState } from 'react';
import {
  validateOwnerName,
  validatePAN,
  validateBusinessType,
  validateMonthlyRevenue,
} from '../utils/validators';

/**
 * BusinessForm — Section A of the lending application form.
 * Collects MSME owner identity and financial snapshot.
 */
export default function BusinessForm({ formData, onChange, errors, setFieldError }) {
  const handleBlur = (field, validator) => {
    const error = validator(formData[field]);
    setFieldError(field, error);
  };

  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-heading">Business Profile</h2>

      {/* Owner Name */}
      <div>
        <label htmlFor="ownerName" className="block text-sm font-medium text-label mb-1.5">
          Owner Name
        </label>
        <input
          id="ownerName"
          type="text"
          value={formData.ownerName}
          onChange={(e) => onChange('ownerName', e.target.value)}
          onBlur={() => handleBlur('ownerName', validateOwnerName)}
          placeholder="e.g. Rajesh Kumar"
          className={`w-full px-3 py-2.5 text-sm border rounded-input outline-none transition-colors
            ${errors.ownerName ? 'border-error' : 'border-border focus:border-primary'}`}
        />
        {errors.ownerName && (
          <p className="mt-1 text-xs text-error">{errors.ownerName}</p>
        )}
      </div>

      {/* PAN Number */}
      <div>
        <label htmlFor="pan" className="block text-sm font-medium text-label mb-1.5">
          PAN Number
        </label>
        <input
          id="pan"
          type="text"
          value={formData.pan}
          onChange={(e) => onChange('pan', e.target.value.toUpperCase())}
          onBlur={() => handleBlur('pan', validatePAN)}
          placeholder="e.g. ABCDE1234F"
          maxLength={10}
          className={`w-full px-3 py-2.5 text-sm border rounded-input outline-none transition-colors uppercase
            ${errors.pan ? 'border-error' : 'border-border focus:border-primary'}`}
        />
        <p className="mt-1 text-xs text-label">Format: 5 letters, 4 digits, 1 letter</p>
        {errors.pan && (
          <p className="mt-0.5 text-xs text-error">{errors.pan}</p>
        )}
      </div>

      {/* Business Type */}
      <div>
        <label htmlFor="businessType" className="block text-sm font-medium text-label mb-1.5">
          Business Type
        </label>
        <select
          id="businessType"
          value={formData.businessType}
          onChange={(e) => onChange('businessType', e.target.value)}
          onBlur={() => handleBlur('businessType', validateBusinessType)}
          className={`w-full px-3 py-2.5 text-sm border rounded-input outline-none transition-colors bg-white
            ${errors.businessType ? 'border-error' : 'border-border focus:border-primary'}`}
        >
          <option value="">Select business type</option>
          <option value="retail">Retail</option>
          <option value="manufacturing">Manufacturing</option>
          <option value="services">Services</option>
          <option value="other">Other</option>
        </select>
        {errors.businessType && (
          <p className="mt-1 text-xs text-error">{errors.businessType}</p>
        )}
      </div>

      {/* Monthly Revenue */}
      <div>
        <label htmlFor="monthlyRevenue" className="block text-sm font-medium text-label mb-1.5">
          Monthly Revenue (₹)
        </label>
        <input
          id="monthlyRevenue"
          type="number"
          value={formData.monthlyRevenue}
          onChange={(e) => onChange('monthlyRevenue', e.target.value)}
          onBlur={() => handleBlur('monthlyRevenue', validateMonthlyRevenue)}
          placeholder="e.g. 500000"
          min="1"
          className={`w-full px-3 py-2.5 text-sm border rounded-input outline-none transition-colors
            ${errors.monthlyRevenue ? 'border-error' : 'border-border focus:border-primary'}`}
        />
        {errors.monthlyRevenue && (
          <p className="mt-1 text-xs text-error">{errors.monthlyRevenue}</p>
        )}
      </div>
    </div>
  );
}
