# Razorpay KYC Sub-Merchant Onboarding - MERN Stack

Complete MERN stack application for Razorpay sub-merchant onboarding with KYC integration.

> **Documentation:** [DOCUMENTATION.md](./DOCUMENTATION.md) | **Task Compliance:** [TASK_COMPLIANCE.md](./TASK_COMPLIANCE.md)

## Features

- **Sub-Merchant Creation** – Create sub-merchants via Razorpay API (name, email, phone, business details)
- **KYC Integration** – Initiate KYC flow and submit documents from the web app
- **KYC Status** – Display status (pending / verified / rejected / needs_clarification)
- **Webhooks** – Handle Razorpay callbacks for account activation, rejection, etc.
- **Security** – API Key & Secret used only on backend; never exposed on frontend

## Project Structure

```
├── backend/
│   ├── config/         # DB config
│   ├── controllers/    # auth, merchant, kyc
│   ├── middleware/     # auth, errorHandler
│   ├── models/         # User, Merchant
│   ├── routes/         # API routes
│   ├── services/       # razorpayService
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       └── services/
└── README.md
```

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### 3. Razorpay Setup

1. Create a Razorpay account and get Partner API keys.
2. Use **Test Mode** keys for development.
3. In Dashboard: **Settings > Webhooks**:
   - Add URL: `https://your-domain.com/api/kyc/webhook`
   - Select events: `account.activated`, `account.rejected`, `account.needs_clarification`, `account.suspended`, `account.updated`
   - Copy the webhook secret to `.env`.

## Environment Variables

### Backend (.env)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `RAZORPAY_KEY_ID` | Razorpay API Key (Partner keys for sub-merchant creation) |
| `RAZORPAY_KEY_SECRET` | Razorpay API Secret |
| `RAZORPAY_DEMO_MODE` | Set to `true` to test without Razorpay (saves to DB only) |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signing secret |
| `FRONTEND_URL` | CORS origin (e.g. http://localhost:5173) |

### Frontend (.env)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL (e.g. http://localhost:5000/api) |

**Security:** Razorpay keys are used only on the backend. The frontend never receives or sends them.

## API Endpoints

### Auth
- `POST /api/auth/register` – Register
- `POST /api/auth/login` – Login
- `GET /api/auth/me` – Current user

### Sub-Merchant
- `POST /api/merchant/create` – Create sub-merchant
- `GET /api/merchant/:id` – Get merchant
- `GET /api/merchant/list` – List merchants
- `PUT /api/merchant/:id` – Update merchant
- `DELETE /api/merchant/:id` – Delete merchant

### KYC
- `POST /api/kyc/initiate/:merchantId` – Initiate KYC
- `GET /api/kyc/status/:merchantId` – Get KYC status
- `POST /api/kyc/refresh/:merchantId` – Refresh status from Razorpay
- `POST /api/kyc/upload-document/:merchantId` – Upload document (form-data: `file`, `type`)
- `POST /api/kyc/bank-details/:merchantId` – Submit bank details
- `POST /api/kyc/webhook` – Razorpay webhook (public)

## KYC Lifecycle

1. **Create Merchant** – Sub-merchant created on Razorpay; status `created`.
2. **Initiate KYC** – Product request (e.g. route); status → `pending`.
3. **Upload Documents** – PAN, GST, etc. via Documents API.
4. **Submit Bank Details** – For settlements (Route).
5. **Razorpay Review** – Status: `under_review` → `activated` or `rejected` or `needs_clarification`.
6. **Webhooks** – Status updated on `account.activated`, `account.rejected`, etc.

## Webhook Events

| Event | Action |
|-------|--------|
| `account.activated` | Mark KYC verified, activate merchant |
| `account.rejected` | Mark rejected, store reason |
| `account.needs_clarification` | Update status, store clarification reason |
| `account.suspended` | Deactivate merchant |
| `account.updated` | Sync latest status |

## Demo Flow

1. **Register** / **Login**
2. **Add Merchant** – Fill 3-step form (business, address, bank + documents)
3. **KYC Auto-initiated** – After creation
4. **Merchant Details** – Refresh status, upload docs, submit bank details
5. **With Partner keys:** Activate account from Razorpay Dashboard to simulate KYC approval  
   **With `RAZORPAY_DEMO_MODE=true`:** Full flow works without Razorpay (DB only)

## Tech Stack

- **Backend:** Node.js, Express, MongoDB, Razorpay API
- **Frontend:** React, Vite, Tailwind CSS, React Router, React Hook Form
- **Auth:** JWT

## License

MIT
