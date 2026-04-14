# MSME Lending Decision System — Architecture Write-Up

**Author**: Candidate Submission  
**Date**: April 2026

---

## 1. Dual Database Architecture: Why PostgreSQL + MongoDB

The system uses PostgreSQL for all transactional data (business profiles, loan applications, decisions) and MongoDB exclusively for audit logs. This is a deliberate architectural choice, not over-engineering.

**PostgreSQL handles transactional data** because lending operations demand ACID guarantees. When a decision is recorded, the `decisions` table insert and the `loan_applications` status update must be consistent — a partial write (decision saved but status not updated) would leave the system in an inconsistent state visible to the polling frontend. PostgreSQL's foreign key constraints (`loan_applications.profile_id → business_profiles.id`) enforce referential integrity at the database level, preventing orphaned records that would corrupt decision logic. Monetary values are stored as `NUMERIC(15,2)`, avoiding the floating-point precision errors that `DOUBLE` or `REAL` types introduce — a critical concern in financial systems where ₹0.01 rounding errors compound across thousands of transactions.

**MongoDB handles audit logs** because audit data has fundamentally different access patterns and schema requirements. Each audit entry captures the full `inputSnapshot` at the time of decision — a denormalized document that includes data from multiple PostgreSQL tables (profile + application + decision). In a relational model, this would require either a JSON column (losing queryability) or a wide table with nullable columns for every possible field. MongoDB's schema flexibility handles this naturally. Audit logs are append-only, never updated or deleted, and queried primarily by `applicationId` for compliance review — a pattern that MongoDB serves efficiently with a single index. Separating audit writes from the transactional path also means a MongoDB slowdown doesn't block or degrade the core lending pipeline.

The alternative — using only PostgreSQL with a JSONB `audit_logs` table — is viable for this scale, but the dual-database approach demonstrates an understanding of polyglot persistence and prepares the system for scenarios where audit log volume (every API call, not just decisions) would dwarf transactional data by orders of magnitude.

---

## 2. Synchronous vs. Asynchronous Decision Processing

The decision engine uses asynchronous processing with a polling pattern, even though the current scoring model executes in under 1ms. This is intentional.

**Why async matters even for a simple engine:**

In production MSME lending, the decision step is never just a local computation. It involves external API calls to credit bureaus (CIBIL, Equifax — 500–2000ms latency each), bank statement analysis services (Perfios, Finbit — 1–5 seconds), GST data pulls from government APIs (unpredictable latency), and potentially ML model inference endpoints. Making this synchronous would mean the HTTP request blocks for 3–10 seconds, risking gateway timeouts, tying up server threads, and creating a poor user experience.

The async pattern implemented here — immediate 202 response with a `pollUrl`, background processing via `setTimeout`, status polling every 2 seconds — mirrors production patterns used by Razorpay (payment verification), Setu (Account Aggregator), and most digital lenders. The `setTimeout` is a deliberate stand-in for a proper job queue (BullMQ/RabbitMQ), demonstrating the architectural intent without introducing infrastructure complexity for a single-day exercise.

**Design decisions in the async flow:**

1. The application is marked `PROCESSING` *before* the background job fires, ensuring the polling endpoint never returns stale `PENDING` status.
2. If the scoring engine throws an unhandled error, a catch block marks the application as `REJECTED` — preventing applications from being permanently stuck in `PROCESSING`.
3. Re-evaluation of already-processed applications is blocked with a 409 response, enforcing idempotency at the application level.

The tradeoff is complexity: the frontend must implement polling logic, and there's a 2–3 second delay even for instant decisions. In production, this would be offset by WebSocket or Server-Sent Events for real-time updates, with polling as a fallback.

---

## 3. Scoring Model: Weight Rationale and Tradeoffs

The scoring model allocates 100 points across five dimensions, with weights reflecting the relative importance of each signal in MSME lending risk assessment.

**Revenue-to-EMI Ratio (30 points)** and **Loan-to-Revenue Multiple (30 points)** together account for 60% of the score. This is intentional — cash flow adequacy is the single most predictive factor for MSME loan repayment. Unlike salaried individuals with stable income, MSMEs have variable revenue, making the EMI-to-revenue ratio the closest proxy for repayment capacity. The 30% EMI threshold for full marks aligns with the RBI's guideline that total EMI obligations should not exceed 40–50% of income (we use a stricter threshold because we're evaluating a single loan without visibility into existing obligations).

**Tenure Risk (20 points)** penalizes both extremes. Very short tenures (3–5 months) signal either desperation or mismatched loan structuring — a ₹10L loan over 5 months implies ₹2L+ monthly payments, which is rarely sustainable. Very long tenures (61–84 months) increase the lender's exposure to business failure over time. The 12–48 month sweet spot reflects typical MSME working capital and equipment financing cycles.

**Business Type (10 points)** is a blunt instrument, but serves as a proxy for revenue predictability. Manufacturing and services businesses typically have contractual revenue (purchase orders, retainers), while retail and "other" categories have higher variance. The 10-point weight ensures this doesn't dominate the decision — a retail business with strong financials still scores 87/100.

**Fraud & Consistency Check (10 points)** catches obvious data anomalies. The 50x revenue threshold for `DATA_INCONSISTENCY` is deliberately generous — a legitimate manufacturer might request 24x monthly revenue for capex. Below ₹10,000 monthly revenue, the business is likely informal or the data is fabricated, warranting a `LOW_REVENUE` flag.

**Key tradeoff**: The model has no external data (bureau scores, banking data, GST filings). In production, these would either replace or augment the self-reported revenue figure, which is the model's weakest input. The scoring architecture is designed to be additive — new dimensions can be added by implementing a scoring function that returns `{ score, flags }` and including it in the `evaluate()` aggregation.

---

## 4. What I Would Add With One More Week

**Day 1–2: BullMQ Job Queue + Redis**

Replace `setTimeout` with a Redis-backed BullMQ queue. This gives us: reliable job execution with automatic retries on failure, job progress tracking visible in a Bull Board dashboard, configurable concurrency (process N decisions in parallel), and dead-letter queues for permanently failed jobs that need manual review. The polling endpoint would read job status from Redis instead of hitting PostgreSQL, reducing database load.

**Day 3: Credit Bureau Integration Layer**

Add an abstraction layer (`services/bureauService.js`) that calls CIBIL/Equifax APIs with circuit breaker patterns (using `opossum`). Bureau scores would become a 6th scoring dimension (e.g., 20 points), with existing dimensions re-weighted. The bureau call happens inside the BullMQ job, with a 5-second timeout and graceful degradation — if the bureau is down, the decision proceeds without bureau data but flags `BUREAU_UNAVAILABLE`.

**Day 4: ML Scoring Layer**

Train a logistic regression model on historical approval/default data (using Python + scikit-learn), export it as a scoring function, and serve it via a lightweight FastAPI endpoint. The Node.js decision engine calls this endpoint as one scoring dimension, blending rule-based and ML-based signals. The ML model would learn non-linear interactions (e.g., "retail + high tenure + low revenue" combinations) that the rule-based model misses.

**Day 5: Webhook Support + Multi-Tenant Auth**

Add a `webhooks` table where API consumers register callback URLs. When a decision completes, the BullMQ job fires a POST to all registered webhooks with the decision payload, with exponential backoff retries. Implement JWT authentication with three roles: `applicant` (submit only), `officer` (view + evaluate), `admin` (full access). Add API key management for B2B integrations.

**Day 6–7: Testing + Observability**

Write unit tests for every scoring function (jest), integration tests for API flows (supertest), and E2E tests for the frontend (Playwright). Add structured logging with pino, Prometheus metrics for request latency/error rates, and health check endpoints that verify database connectivity. Set up a GitHub Actions CI pipeline that runs tests, lints, and builds on every push.
