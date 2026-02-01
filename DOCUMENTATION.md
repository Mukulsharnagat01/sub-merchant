# Razorpay KYC Sub-Merchant Onboarding - Documentation

Complete documentation for the Razorpay KYC Sub-Merchant Onboarding MERN stack application.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Project Structure](#3-project-structure)
4. [Setup & Installation](#4-setup--installation)
5. [Environment Variables](#5-environment-variables)
6. [Database Models](#6-database-models)
7. [API Reference](#7-api-reference)
8. [Frontend Components](#8-frontend-components)
9. [User Flow](#9-user-flow)
10. [Razorpay Integration](#10-razorpay-integration)
11. [Security](#11-security)
12. [Demo Mode](#12-demo-mode)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Overview

### Purpose
This application integrates Razorpay's sub-merchant onboarding and KYC verification into a web application. It allows users to:

- Create sub-merchant accounts via Razorpay API
- Initiate and manage KYC verification
- Upload KYC documents (PAN, GST, etc.)
- Submit bank details for settlements
- Track KYC status (pending, verified, rejected)
- Handle Razorpay webhooks for status updates

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, React Router, React Hook Form |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Auth | JWT (JSON Web Tokens) |
| Payment/KYC | Razorpay Partner API |

---

## 2. Architecture

```
┌─────────────────┐     HTTP/REST      ┌─────────────────┐
│   React App     │ ◄────────────────► │  Express API    │
│   (Port 5173)   │     (Port 5000)    │   (Backend)     │
└─────────────────┘                    └────────┬────────┘
                                                │
                        ┌───────────────────────┼───────────────────────┐
                        │                       │                       │
                        ▼                       ▼                       ▼
                ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
                │   MongoDB     │       │   Razorpay    │       │   Webhooks    │
                │   (Atlas)     │       │   Partner API │       │   (Razorpay)  │
                └───────────────┘       └───────────────┘       └───────────────┘
```

### Data Flow
1. **User** → Frontend (React) → Backend (Express) → MongoDB / Razorpay
2. **Razorpay** → Webhook → Backend → MongoDB (status update)
3. **Frontend** → JWT in header → Backend validates → Protected routes

---

## 3. Project Structure

```
razorpay-kyc-app/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js  # Register, login, profile
│   │   ├── merchantController.js  # CRUD merchants
│   │   └── kycController.js   # KYC initiate, docs, webhooks
│   ├── middleware/
│   │   ├── auth.js            # JWT verification
│   │   └── errorHandler.js    # Global error handler
│   ├── models/
│   │   ├── User.js            # User schema
│   │   └── Merchant.js        # Merchant schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── merchantRoutes.js
│   │   └── kycRoutes.js
│   ├── services/
│   │   └── razorpayService.js # Razorpay API wrapper
│   ├── server.js
│   ├── nodemon.json
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── KycStatusBadge.jsx
│   │   │   ├── Layout.jsx
│   │   │   └── Loading.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CreateMerchant.jsx
│   │   │   ├── MerchantList.jsx
│   │   │   └── MerchantDetails.jsx
│   │   ├── services/
│   │   │   └── api.js         # Axios API client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── README.md
├── DOCUMENTATION.md
└── TASK_COMPLIANCE.md
```

---

## 4. Setup & Installation

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- Razorpay account (Partner keys for production)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

**Scripts:**
- `npm start` - Start production server
- `npm run dev` - Start with nodemon (hot reload)

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL to backend URL
npm run dev
```

**Scripts:**
- `npm run dev` - Development server (Vite)
- `npm run build` - Production build
- `npm run preview` - Preview production build

### Razorpay Dashboard Setup
1. Create account at [razorpay.com](https://razorpay.com)
2. **Test Mode:** Settings → API Keys → Generate Test Keys
3. **Partner API:** Sub-merchant creation requires Partner/Connect API keys
4. **Webhooks:** Settings → Webhooks → Add URL: `https://your-domain.com/api/kyc/webhook`
   - Select: `account.activated`, `account.rejected`, `account.needs_clarification`, `account.suspended`, `account.updated`
   - Copy secret → `RAZORPAY_WEBHOOK_SECRET`

---

## 5. Environment Variables

### Backend (.env)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | No | Server port | `5000` |
| `NODE_ENV` | No | Environment | `development` |
| `MONGODB_URI` | Yes | MongoDB connection string | `mongodb://localhost:27017/razorpay_kyc` |
| `JWT_SECRET` | Yes | JWT signing secret (min 32 chars) | `your_secret_key` |
| `RAZORPAY_KEY_ID` | Yes | Razorpay API Key | `rzp_test_xxxx` |
| `RAZORPAY_KEY_SECRET` | Yes | Razorpay API Secret | `xxxx` |
| `RAZORPAY_WEBHOOK_SECRET` | Yes | Webhook signing secret | `xxxx` |
| `RAZORPAY_DEMO_MODE` | No | Set `true` to test without Razorpay | `true` |
| `FRONTEND_URL` | No | CORS origin | `http://localhost:5173` |

### Frontend (.env)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | Yes | Backend API base URL | `http://localhost:5000/api` |

---

## 6. Database Models

### User
| Field | Type | Description |
|-------|------|-------------|
| name | String | User name |
| email | String | Unique, lowercase |
| password | String | Bcrypt hashed |
| role | String | `admin` \| `user` |
| createdAt | Date | Auto |

### Merchant
| Field | Type | Description |
|-------|------|-------------|
| createdBy | ObjectId | Ref User |
| razorpayAccountId | String | Razorpay account ID or `demo_xxx` |
| businessName | String | Required |
| businessType | String | individual, partnership, etc. |
| businessCategory | String | ecommerce, healthcare, etc. |
| contactName | String | Required |
| email | String | Required |
| phone | String | Required |
| address | Object | street, city, state, pincode, country |
| legalInfo | Object | pan, gst |
| bankDetails | Object | accountNumber, ifscCode, beneficiaryName |
| kycStatus | String | not_started, pending, activated, etc. |
| kycDetails | Object | submittedAt, verifiedAt, rejectionReason |
| documents | Array | { type, url, razorpayDocId, uploadedAt } |
| isActive | Boolean | Default false |
| createdAt, updatedAt | Date | Auto |

---

## 7. API Reference

### Base URL
```
http://localhost:5000/api
```

### Authentication
Protected routes require header:
```
Authorization: Bearer <jwt_token>
```

---

### Auth Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Register user |
| POST | `/auth/login` | No | Login, returns JWT |
| GET | `/auth/me` | Yes | Current user |
| PUT | `/auth/profile` | Yes | Update profile |
| PUT | `/auth/password` | Yes | Change password |

**Register Body:**
```json
{ "name": "John", "email": "john@example.com", "password": "password123" }
```

**Login Body:**
```json
{ "email": "john@example.com", "password": "password123" }
```

---

### Merchant Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/merchant/create` | Yes | Create sub-merchant |
| GET | `/merchant/list` | Yes | List merchants (paginated) |
| GET | `/merchant/:id` | Yes | Get merchant |
| PUT | `/merchant/:id` | Yes | Update merchant |
| DELETE | `/merchant/:id` | Yes | Delete merchant |
| GET | `/merchant/stats` | Yes | Merchant statistics |

**Create Merchant Body:**
```json
{
  "businessName": "Acme Corp",
  "businessType": "individual",
  "businessCategory": "ecommerce",
  "contactName": "John Doe",
  "email": "contact@acme.com",
  "phone": "9876543210",
  "address": { "street": "123 Main St", "city": "Mumbai", "state": "MH", "pincode": "400001" },
  "legalInfo": { "pan": "AAAAA9999A", "gst": "" },
  "bankDetails": { "accountNumber": "1234567890", "ifscCode": "SBIN0001234", "beneficiaryName": "Acme" }
}
```

---

### KYC Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/kyc/initiate/:merchantId` | Yes | Initiate KYC |
| GET | `/kyc/status/:merchantId` | Yes | Get KYC status |
| POST | `/kyc/refresh/:merchantId` | Yes | Refresh from Razorpay |
| POST | `/kyc/upload-document/:merchantId` | Yes | Upload document (form-data) |
| POST | `/kyc/bank-details/:merchantId` | Yes | Submit bank details |
| POST | `/kyc/webhook` | No | Razorpay webhook (signature verified) |

**Upload Document:** `multipart/form-data`
- `file` - PDF/JPG/PNG
- `type` - `pan` \| `gst_certificate` \| etc.

**Bank Details Body:**
```json
{
  "accountNumber": "1234567890",
  "ifscCode": "SBIN0001234",
  "beneficiaryName": "Acme Corp"
}
```

---

## 8. Frontend Components

### Pages
| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | User login |
| Register | `/register` | User registration |
| Dashboard | `/dashboard` | Stats, recent merchants |
| MerchantList | `/merchants` | List with search, filter, pagination |
| CreateMerchant | `/merchants/create` | 3-step form |
| MerchantDetails | `/merchants/:id` | Details, KYC actions |

### Components
| Component | Description |
|-----------|-------------|
| Layout | Sidebar, header, outlet |
| KycStatusBadge | Status pill (pending, activated, etc.) |
| Loading | Spinner during auth check |

### Context
- **AuthContext** - User state, login, logout, token

---

## 9. User Flow

```
1. Register/Login
       ↓
2. Dashboard (view stats)
       ↓
3. Add Merchant
   - Step 1: Business details (name, type, category, contact, email, phone)
   - Step 2: Address, PAN, GST
   - Step 3: Bank details, PAN doc, GST doc upload
       ↓
4. Merchant Created
   - Razorpay account created (or demo)
   - Documents uploaded (if provided)
   - KYC auto-initiated
       ↓
5. Merchant List / Merchant Details
   - View status
   - Refresh status
   - Submit bank details
   - Upload more documents
```

---

## 10. Razorpay Integration

### APIs Used
| Razorpay API | Endpoint | Purpose |
|--------------|----------|---------|
| Create Account | `POST /v2/accounts` | Sub-merchant creation |
| Fetch Account | `GET /v2/accounts/:id` | Get account details |
| Products Request | `POST /v1/products` | Initiate KYC (payments/route) |
| Documents | `POST /v1/documents` | Upload KYC documents |

### KYC Status Mapping
| Razorpay Status | App Status |
|-----------------|------------|
| created | pending |
| pending | pending |
| under_review | under_review |
| needs_clarification | needs_clarification |
| activated | activated |
| suspended | suspended |
| rejected | rejected |

### Webhook Events
| Event | Handler |
|-------|---------|
| account.activated | Set kycStatus=activated, isActive=true |
| account.rejected | Set kycStatus=rejected, store reason |
| account.needs_clarification | Set kycStatus, store reason |
| account.suspended | Set kycStatus=suspended |
| account.updated | Sync latest status |

---

## 11. Security

- **API Keys:** Stored only in backend `.env`, never sent to frontend
- **JWT:** HttpOnly not used; token in localStorage, sent via `Authorization` header
- **CORS:** Backend allows specific origins (localhost:5173, 5174)
- **Webhook:** Signature verified with `RAZORPAY_WEBHOOK_SECRET`
- **Validation:** express-validator on all inputs
- **Password:** Bcrypt hashed before storage

---

## 12. Demo Mode

When `RAZORPAY_DEMO_MODE=true`:

- Merchant creation skips Razorpay (saves to DB with `demo_xxx` account ID)
- KYC initiate updates DB only
- Refresh status returns DB status
- Document upload saves metadata only
- Bank details save to DB only

**Use case:** Testing without Razorpay Partner API keys.

---

## 13. Troubleshooting

### Port 5000 already in use
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### CORS Error
- Ensure `FRONTEND_URL` in backend `.env` includes your frontend origin
- Backend allows: localhost:5173, localhost:5174

### "Access Denied" from Razorpay
- Sub-merchant creation requires **Partner/Connect** API keys (not standard keys)
- Add `RAZORPAY_DEMO_MODE=true` to test without Partner keys

### Mongoose strictQuery Warning
- Already fixed in `config/db.js` with `mongoose.set('strictQuery', true)`

### 401 Unauthorized
- Token expired or invalid
- Login again to get new token

### Document Upload Fails
- Ensure multer `uploads/` directory exists
- Max file size: 4MB (JPG/PNG), 2MB (PDF)
- Accept: `.pdf`, `.jpg`, `.png`

---

## Related Documents

- [README.md](./README.md) - Quick start
- [TASK_COMPLIANCE.md](./TASK_COMPLIANCE.md) - Task requirement mapping
