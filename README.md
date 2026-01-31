# Razorpay KYC Sub-Merchant Onboarding - MERN Stack

## 🚀 Project Overview
Complete MERN stack application for Razorpay sub-merchant onboarding with KYC integration.

## 📁 Project Structure
```
razorpay-kyc-app/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── merchantController.js
│   │   └── kycController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   └── Merchant.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── merchantRoutes.js
│   │   └── kycRoutes.js
│   ├── services/
│   │   └── razorpayService.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── services/
│   │   └── App.jsx
│   ├── .env.example
│   └── package.json
└── README.md
```

## 🔧 Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Add your credentials in .env
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 🔑 Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/razorpay_kyc
JWT_SECRET=your_jwt_secret_here
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Sub-Merchant
- `POST /api/merchant/create` - Create sub-merchant
- `GET /api/merchant/:id` - Get merchant details
- `GET /api/merchant/list` - List all merchants

### KYC
- `POST /api/kyc/initiate/:merchantId` - Initiate KYC
- `GET /api/kyc/status/:merchantId` - Get KYC status
- `POST /api/kyc/webhook` - Razorpay webhook handler

## 🔐 Razorpay API Reference

### Create Sub-Merchant (Account)
```
POST https://api.razorpay.com/v2/accounts
```

### KYC Status Check
```
GET https://api.razorpay.com/v2/accounts/{account_id}
```

## 📋 Features
- ✅ User Authentication (JWT)
- ✅ Sub-Merchant Creation
- ✅ KYC Document Upload
- ✅ KYC Status Tracking
- ✅ Webhook Handling
- ✅ Secure API Key Management
