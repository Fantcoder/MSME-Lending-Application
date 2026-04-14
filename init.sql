-- ============================================================================
-- MSME Lending Decision System — PostgreSQL Schema Initialization
-- ============================================================================
-- This file is mounted into the Postgres container and runs on first boot.
-- It creates the three core transactional tables used by the lending API.
-- ============================================================================

-- Ensure UUID generation is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Business Profiles ──────────────────────────────────────────────────────
-- Stores MSME owner identity and financial snapshot at time of registration.
CREATE TABLE IF NOT EXISTS business_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_name      VARCHAR(255) NOT NULL,
  pan             VARCHAR(10) NOT NULL,
  business_type   VARCHAR(50) NOT NULL CHECK (business_type IN ('retail', 'manufacturing', 'services', 'other')),
  monthly_revenue NUMERIC(15,2) NOT NULL CHECK (monthly_revenue > 0),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Loan Applications ──────────────────────────────────────────────────────
-- Each application is linked to a business profile and tracks lifecycle status.
CREATE TABLE IF NOT EXISTS loan_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES business_profiles(id) ON DELETE RESTRICT,
  loan_amount     NUMERIC(15,2) NOT NULL CHECK (loan_amount > 0),
  tenure_months   INTEGER NOT NULL CHECK (tenure_months BETWEEN 3 AND 84),
  purpose         TEXT NOT NULL,
  estimated_emi   NUMERIC(15,2),
  status          VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'APPROVED', 'REJECTED')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Decisions ───────────────────────────────────────────────────────────────
-- Immutable record of each credit decision. One decision per application.
CREATE TABLE IF NOT EXISTS decisions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES loan_applications(id) ON DELETE RESTRICT,
  decision        VARCHAR(10) NOT NULL CHECK (decision IN ('APPROVED', 'REJECTED')),
  credit_score    INTEGER NOT NULL CHECK (credit_score BETWEEN 0 AND 100),
  reason_codes    TEXT[] NOT NULL DEFAULT '{}',
  processing_ms   INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes for common queries ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_loan_applications_profile_id ON loan_applications(profile_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_decisions_application_id ON decisions(application_id);
