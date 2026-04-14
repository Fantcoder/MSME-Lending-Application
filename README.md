# MSME Lending Decision System

A lightweight, end-to-end lending decision system that accepts MSME business profiles and loan inputs, runs them through a credit decision engine, and surfaces a structured decision with reasoning. Built with clean architecture, real-world constraints, and thoughtful product judgment.

---

## Prerequisites

- **Node.js** ≥ 18.x
- **Docker** & **Docker Compose** (for containerized setup)
- **PostgreSQL** 15+ (if running without Docker)
- **MongoDB** 6+ (if running without Docker)

---

## Running with Docker Compose

```bash
# 1. Clone the repository
git clone https://github.com/Fantcoder/MSME-Lending-Application && cd msme-lending

# 2. Start all services (PostgreSQL, MongoDB, Backend, Frontend)
docker-compose up --build

# 3. Access the application
#    Frontend: http://localhost:5173
#    Backend:  http://localhost:4000
#    Health:   http://localhost:4000/api/v1/health
```

The `init.sql` file automatically creates all PostgreSQL tables on first boot.

---

## Running Manually (Without Docker)

### 1. Set up PostgreSQL

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE msme_lending;"

# Run the schema
psql -U postgres -d msme_lending -f init.sql
```

### 2. Start MongoDB

```bash
mongod --dbpath /data/db
```

### 3. Backend

```bash
cd backend

# Create .env from template
cp .env.example .env
# Edit .env if your local DB credentials differ

npm install
npm run dev
# Server starts on http://localhost:4000
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:5173
```

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Backend server port | `4000` |
| `NODE_ENV` | Environment mode | `development` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` |
| `PG_HOST` | PostgreSQL host | `localhost` |
| `PG_PORT` | PostgreSQL port | `5432` |
| `PG_USER` | PostgreSQL user | `postgres` |
| `PG_PASSWORD` | PostgreSQL password | `postgres` |
| `PG_DATABASE` | PostgreSQL database name | `msme_lending` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/msme_lending_audit` |

---

## API Reference

### Health Check

```
GET /api/v1/health
```

**Response:**
```json
{ "success": true, "data": { "status": "ok", "timestamp": "2024-01-15T10:30:00.000Z" } }
```

---

### Create Business Profile

```
POST /api/v1/business/profile
Content-Type: application/json
```

**Request Body:**
```json
{
  "ownerName": "Rajesh Kumar",
  "pan": "ABCDE1234F",
  "businessType": "manufacturing",
  "monthlyRevenue": 500000
}
```

| Field | Type | Constraints |
|---|---|---|
| `ownerName` | string | Required, 2–100 characters |
| `pan` | string | Required, regex: `/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/` |
| `businessType` | string | Required, enum: `retail`, `manufacturing`, `services`, `other` |
| `monthlyRevenue` | number | Required, must be > 0 (INR) |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "profileId": "a1b2c3d4-...",
    "ownerName": "Rajesh Kumar",
    "businessType": "manufacturing",
    "monthlyRevenue": 500000
  }
}
```

**Error Response (400) — Invalid PAN:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PAN",
    "message": "Validation failed",
    "details": [
      { "field": "pan", "message": "PAN must match format: ABCDE1234F (5 letters, 4 digits, 1 letter)", "value": "abc" }
    ]
  }
}
```

**Error Response (400) — Invalid Revenue:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REVENUE",
    "message": "Validation failed",
    "details": [
      { "field": "monthlyRevenue", "message": "Monthly revenue must be a positive number", "value": -5000 }
    ]
  }
}
```

---

### Submit Loan Application

```
POST /api/v1/loan/apply
Content-Type: application/json
```

**Request Body:**
```json
{
  "profileId": "a1b2c3d4-...",
  "loanAmount": 1000000,
  "tenureMonths": 36,
  "purpose": "Purchase of CNC machinery for expanding manufacturing capacity"
}
```

| Field | Type | Constraints |
|---|---|---|
| `profileId` | UUID | Required, must exist in DB |
| `loanAmount` | number | Required, must be > 0 (INR) |
| `tenureMonths` | integer | Required, 3–84 |
| `purpose` | string | Required, 10–500 characters |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "applicationId": "e5f6g7h8-...",
    "estimatedEMI": 36152.44,
    "loanAmount": 1000000,
    "tenureMonths": 36
  }
}
```

**Error Response (404) — Profile Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "PROFILE_NOT_FOUND",
    "message": "Business profile with id 00000000-0000-0000-0000-000000000000 does not exist"
  }
}
```

---

### Evaluate Decision (Async)

```
POST /api/v1/decision/evaluate
Content-Type: application/json
```

**Request Body:**
```json
{ "applicationId": "e5f6g7h8-..." }
```

**Success Response (202):**
```json
{
  "success": true,
  "data": {
    "applicationId": "e5f6g7h8-...",
    "status": "PROCESSING",
    "pollUrl": "/api/v1/decision/status/e5f6g7h8-..."
  }
}
```

**Rate Limited (429):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many decision requests. Please try again after 1 minute."
  }
}
```

---

### Poll Decision Status

```
GET /api/v1/decision/status/:applicationId
```

**Response — Still Processing:**
```json
{
  "success": true,
  "data": {
    "applicationId": "e5f6g7h8-...",
    "status": "PROCESSING"
  }
}
```

**Response — Complete:**
```json
{
  "success": true,
  "data": {
    "applicationId": "e5f6g7h8-...",
    "status": "COMPLETE",
    "decision": {
      "applicationId": "e5f6g7h8-...",
      "decision": "APPROVED",
      "creditScore": 87,
      "reasonCodes": ["STRONG_PROFILE"],
      "estimatedEMI": 36152.44,
      "processingMs": 2547
    }
  }
}
```

---

## Decision Logic

### Scoring Model (100 points total)

| Dimension | Max Points | Criteria |
|---|---|---|
| **A. Revenue-to-EMI Ratio** | 30 | EMI < 30% revenue → 30 pts · 30–50% → 20 pts · 50–70% → 10 pts · > 70% → 0 pts + `HIGH_EMI_BURDEN` |
| **B. Loan-to-Revenue Multiple** | 30 | < 6x → 30 pts · 6–12x → 20 pts · 12–18x → 10 pts · > 18x → 0 pts + `HIGH_LOAN_RATIO` |
| **C. Tenure Risk** | 20 | 12–48 mo → 20 pts · 6–11 or 49–60 mo → 12 pts · 3–5 or 61–84 mo → 5 pts + `TENURE_RISK` |
| **D. Business Type** | 10 | manufacturing/services → 10 pts · retail → 7 pts · other → 4 pts |
| **E. Fraud & Consistency** | 10 | No flags → 10 pts · Loan > 50x revenue → 0 pts + `DATA_INCONSISTENCY` · Revenue < ₹10K → 0 pts + `LOW_REVENUE` |

### Decision Rule

- **Score ≥ 60** → `APPROVED`
- **Score < 60** → `REJECTED`
- **Score > 80 and APPROVED** → also tagged `STRONG_PROFILE`

### Reason Codes

| Code | Description |
|---|---|
| `LOW_REVENUE` | Monthly revenue below ₹10,000 threshold |
| `HIGH_LOAN_RATIO` | Loan exceeds 18x monthly revenue |
| `HIGH_EMI_BURDEN` | EMI exceeds 70% of monthly revenue |
| `TENURE_RISK` | Tenure is 3–5 or 61–84 months (high risk bands) |
| `DATA_INCONSISTENCY` | Loan amount exceeds 50x monthly revenue |
| `STRONG_PROFILE` | Score above 80 with approval — strong financials |

---

## Edge Case Handling

- **Missing or partial form fields**: All fields are validated on both frontend (blur + submit) and backend (express-validator). All errors returned at once, not one at a time.
- **Negative or zero revenue**: Backend rejects with `INVALID_REVENUE` error code. Frontend prevents submission with inline validation.
- **Malformed PAN**: Rejected by regex `/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/` on both frontend and backend.
- **Non-existent profileId**: Loan endpoint returns 404 with `PROFILE_NOT_FOUND`.
- **Non-existent applicationId**: Decision endpoints return 404 with `APPLICATION_NOT_FOUND`.
- **Duplicate evaluation**: If an application is already processed (not PENDING), returns 409 with `ALREADY_PROCESSED`.
- **Conflicting data** (e.g., ₹10L revenue + ₹5Cr loan): The scoring model flags `DATA_INCONSISTENCY` (loan > 50x revenue) and scores 0 in the fraud dimension. Combined with high EMI burden, this typically leads to rejection.
- **Very low revenue** (< ₹10,000/month): Flagged as `LOW_REVENUE` — fraud/consistency dimension scores 0.
- **Rate limiting abuse**: POST `/decision/evaluate` limited to 10 requests/minute/IP. Returns 429 with `RATE_LIMIT_EXCEEDED`.
- **Database connection failure**: Server refuses to start if PostgreSQL or MongoDB connections fail at boot.
- **Malformed JSON body**: Express returns 400 with `BAD_REQUEST` via the global error handler.
- **Decision engine crash**: If scoring throws during async processing, the application is marked `REJECTED` as a safety fallback. Error is logged server-side.
- **Monetary precision**: All monetary values stored as `NUMERIC(15,2)` in PostgreSQL — never as floating point.
- **API error display**: Frontend shows API error messages inline in a red notice box — never crashes or shows a blank screen.

---

## Assumptions

1. **Fixed interest rate**: 18% p.a. (1.5% monthly) — a common unsecured MSME lending rate in India (NBFCs like Lendingkart, Indifi use 15–24%).
2. **No authentication**: This is a decision engine demo, not a multi-tenant SaaS. Auth would be added in production.
3. **Single evaluation per application**: Each loan application can only be evaluated once. Re-evaluation requires a new application.
4. **Synchronous profile + loan creation**: Only the decision evaluation is async. Profile and loan creation are fast write operations.
5. **No bureau integration**: Credit bureau (CIBIL/Equifax) scores would be a separate data source in production. Our scoring model is self-contained.
6. **No file uploads**: GST returns, bank statements, etc. would require a document processing pipeline.
7. **PAN is not deduplicated**: Multiple profiles can have the same PAN. In production, PAN would be unique per business entity.

---

## What I Would Improve With More Time

1. **BullMQ job queue**: Replace `setTimeout` with a proper Redis-backed job queue for reliable async processing with retries and dead-letter queues.
2. **Credit bureau integration**: Pull CIBIL/Equifax scores as an additional scoring dimension with configurable weights.
3. **ML scoring layer**: Train a logistic regression or gradient-boosted model on historical approval data to replace or augment the rule-based scorer.
4. **Webhook support**: Allow API consumers to register webhook URLs for decision notifications instead of polling.
5. **Multi-tenant auth**: JWT-based authentication with role-based access control (loan officer, admin, auditor).
6. **Idempotency keys**: Prevent duplicate submissions on network retries.
7. **Comprehensive test suite**: Unit tests for scoring model, integration tests for API endpoints, E2E tests with Playwright.
8. **Observability**: Structured logging (pino/winston), Prometheus metrics, distributed tracing with OpenTelemetry.
9. **CI/CD pipeline**: GitHub Actions for lint, test, build, and deploy to staging/production.
10. **Database migrations**: Use a migration tool (node-pg-migrate) instead of raw init.sql for schema versioning.
