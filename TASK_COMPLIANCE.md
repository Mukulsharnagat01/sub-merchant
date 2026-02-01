# Task Compliance: Razorpay KYC Sub-Merchant Onboarding

This document maps the implementation to each requirement of the task.

---

## ✅ 1. Sub-Merchant Creation

### Requirement
- Use Razorpay APIs to create a sub-merchant from the web application
- Collect basic details (name, email, phone, business details)

### Implementation
| Aspect | Location | Details |
|--------|----------|---------|
| **Razorpay API** | `backend/services/razorpayService.js` → `createSubMerchant()` | Calls `POST /v2/accounts` (Razorpay Partner Account API) |
| **Web Form** | `frontend/src/pages/CreateMerchant.jsx` | Multi-step form (3 steps) |
| **Backend Controller** | `backend/controllers/merchantController.js` → `createMerchant()` | Validates, calls Razorpay, saves to MongoDB |

**Collected Fields:**
- **Basic:** contactName, email, phone
- **Business:** businessName, businessType, businessCategory, businessSubCategory
- **Address:** street, city, state, pincode, country
- **Legal:** PAN, GST (optional)
- **Bank:** accountNumber, ifscCode, beneficiaryName (optional)
- **Documents:** PAN document, GST certificate (file upload)

**Demo Mode:** `RAZORPAY_DEMO_MODE=true` in `.env` allows testing without Razorpay Partner keys (saves to DB only).

---

## ✅ 2. KYC Integration

### Requirement
- Integrate Razorpay's KYC flow for the sub-merchant
- Allow the sub-merchant to submit required KYC details/documents
- KYC should be initiated from the web application

### Implementation
| Feature | API Endpoint | Location |
|---------|--------------|----------|
| **Initiate KYC** | `POST /api/kyc/initiate/:merchantId` | `kycController.js` → `initiateKyc()` |
| | | Calls Razorpay Product API (`payments` for individual, `route` for business) |
| **Upload Documents** | `POST /api/kyc/upload-document/:merchantId` | `kycController.js` → `uploadKycDocument()` |
| | | Uploads via Razorpay Documents API (`POST /v1/documents`) |
| **Bank Details** | `POST /api/kyc/bank-details/:merchantId` | `kycController.js` → `submitBankDetails()` |
| | | For Route product settlements |

**Flow:**
1. User creates merchant → Razorpay account created
2. Auto-initiate KYC after creation (CreateMerchant.jsx)
3. User can upload PAN, GST documents from MerchantDetails page
4. User can submit bank details for settlements

---

## ✅ 3. KYC Status Handling

### Requirement
- Fetch and display the KYC status (pending / verified / rejected)
- Handle Razorpay callbacks or webhooks

### Implementation

**Status Display:**
| Component | Location | Statuses Shown |
|-----------|----------|----------------|
| **KycStatusBadge** | `frontend/src/components/KycStatusBadge.jsx` | not_started, pending, under_review, needs_clarification, activated, suspended, rejected |
| **MerchantDetails** | `frontend/src/pages/MerchantDetails.jsx` | Badge + activity timeline |
| **MerchantList** | `frontend/src/pages/MerchantList.jsx` | Status column per merchant |

**Status APIs:**
- `GET /api/kyc/status/:merchantId` – Get status from DB
- `POST /api/kyc/refresh/:merchantId` – Sync status from Razorpay

**Webhook Handler:**
| Event | Endpoint | Handler |
|-------|----------|---------|
| `account.activated` | `POST /api/kyc/webhook` | Sets kycStatus=activated, isActive=true |
| `account.rejected` | Same | Sets kycStatus=rejected, stores reason |
| `account.needs_clarification` | Same | Sets kycStatus=needs_clarification |
| `account.suspended` | Same | Sets kycStatus=suspended |
| `account.updated` | Same | Syncs latest status |

**Webhook Setup (Razorpay Dashboard):**
1. Settings → Webhooks → Add URL: `https://your-domain.com/api/kyc/webhook`
2. Select events: account.activated, account.rejected, account.needs_clarification, account.suspended, account.updated
3. Copy webhook secret → `RAZORPAY_WEBHOOK_SECRET` in `.env`

---

## ✅ 4. Security

### Requirement
- Use Razorpay API Key & Secret securely
- No keys should be exposed on the frontend

### Implementation
| Measure | Details |
|---------|---------|
| **Backend only** | `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `backend/.env` |
| **No frontend keys** | Frontend `.env` has only `VITE_API_URL` (backend URL) |
| **All Razorpay calls** | Made from backend (`razorpayService.js`, controllers) |
| **JWT auth** | Protected routes require `Authorization: Bearer <token>` |
| **Webhook verification** | Raw body + signature verified before processing |

---

## ✅ 5. Working Demo

### How to Run

**Backend:**
```bash
cd backend
npm install
cp .env.example .env   # Edit with your values
# Add RAZORPAY_DEMO_MODE=true for testing without Partner keys
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

**Demo Flow:**
1. Register → Login
2. Add Merchant → Fill 3-step form (business, address, bank + docs)
3. Merchant created (Razorpay in demo mode, or real API with Partner keys)
4. KYC auto-initiated
5. View Merchant Details → See status, refresh, upload docs, submit bank details
6. (With webhooks) Status updates on Razorpay events

---

## Evaluation Focus Alignment

| Criteria | How Addressed |
|----------|---------------|
| **Correct use of Razorpay sub-merchant & KYC APIs** | `razorpayService.js` uses Partner Account API, Products API, Documents API. Payload structure matches Razorpay docs. |
| **Clean and practical web integration** | MERN stack, multi-step form, React Hook Form, Tailwind, REST API, JWT auth |
| **Understanding of KYC lifecycle** | created → pending (initiate) → under_review → activated/rejected/needs_clarification. Webhooks sync status. |

---

## File Reference

```
backend/
├── services/razorpayService.js   # Razorpay API calls
├── controllers/merchantController.js
├── controllers/kycController.js  # KYC flow, webhooks
├── routes/merchantRoutes.js
├── routes/kycRoutes.js
└── models/Merchant.js

frontend/
├── pages/CreateMerchant.jsx      # Sub-merchant creation form
├── pages/MerchantDetails.jsx     # KYC status, actions
├── pages/MerchantList.jsx
├── components/KycStatusBadge.jsx
└── services/api.js
```
