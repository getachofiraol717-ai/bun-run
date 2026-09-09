# 🚀 Knowledge Universe — v6

A futuristic AI-powered EdTech platform for Ethiopian students (Grades 1–12).

Built with: **React 18 + TypeScript + Vite + Tailwind + Supabase + Three.js**

---

## ⚡ Quick Setup

### 1. Clone & Install

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

### 3. Run Supabase Migrations

```bash
npx supabase db push
# or apply migrations in order from supabase/migrations/
```

### 4. Deploy Edge Functions

```bash
npx supabase functions deploy ai-tutor
npx supabase functions deploy chapa-payment
npx supabase functions deploy create-superuser
```

### 5. Set Edge Function Secrets

In Supabase Dashboard → Edge Functions → Secrets:

| Secret | Description |
|--------|-------------|
| `CHAPA_SECRET_KEY` | Your Chapa live secret key from chapa.co |
| `CHAPA_WEBHOOK_SECRET` | Chapa webhook signing secret |
| `APP_URL` | Your deployed app URL (for redirect callbacks) |

### 6. Create Admin User

```bash
curl -X POST https://your-project.supabase.co/functions/v1/create-superuser \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"StrongPass123!","name":"Admin"}'
```

### 7. Enable Google OAuth

Supabase Dashboard → Authentication → Providers → Google:
- Add your Google OAuth Client ID & Secret
- Set redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### 8. Run Dev Server

```bash
npm run dev
```

---

## 🏗️ Architecture

```
src/
├── contexts/
│   ├── AuthContext.tsx         # Auth + Google OAuth + subscription expiry
│   └── LanguageContext.tsx     # i18n (English, Amharic, Afaan Oromo)
├── pages/
│   ├── Login.tsx               # Login + Google button + Forgot Password
│   ├── Register.tsx            # Register + phone number + Google
│   ├── Pricing.tsx             # Secure payment flow (backend-only status)
│   ├── Admin.tsx               # Full admin panel
│   └── AdminLogin.tsx          # Double-door security gate
├── components/
│   └── admin/
│       └── PaymentsDashboard.tsx  # Full payment management
├── hooks/
│   └── useAdminData.ts         # All admin data hooks + payment mutations
└── integrations/supabase/

supabase/
├── functions/
│   ├── chapa-payment/          # Secure payment edge function
│   │   └── index.ts
│   ├── ai-tutor/               # AI tutor with usage limits
│   └── create-superuser/       # Admin provisioning
└── migrations/
    └── 20260517000001_secure_payment_system.sql
```

---

## 🔒 Security Model

### Payment Security (Task 1)
- **Frontend NEVER sets payment status** — only the backend Edge Function does
- **Chapa webhook double-verification** — every webhook is re-verified against Chapa API
- **SECURITY DEFINER function** `verify_payment_and_upgrade()` — only callable by service role
- **Duplicate reference detection** — prevents replay attacks
- **Rate limiting** — max 5 payment initiations per user per hour
- **RLS policies** — users can only read their own payments, never update
- **Admin RPCs** `admin_approve_manual_payment()`, `admin_reject_payment()`, `flag_suspicious_payment()`

### Admin Security (Task 2)
- **Double-door login** — two separate credential verifications required
- **Brute-force lockout** — 5 failed attempts → 15-minute lockout
- **Session tracking** in `admin_sessions` table
- **Role checked twice** — once per door, server-side each time
- **Subscription expiry** — `check_subscription_validity()` called on every login

### Auth Security
- **Google OAuth** via Supabase (no passwords stored for Google users)
- **Password reset** via secure email link (Supabase managed)
- **Login history** stored in `login_history` table
- **Subscription validated** on login and every 5 minutes client-side

---

## 💳 Payment Flow

### Manual Bank Transfer (Abisiniya Bank, Awash Bank)
```
User selects plan → Backend creates payment record (status: pending)
→ User transfers money manually
→ User submits reference number → Backend stores it (status: processing)
→ Admin reviews in Payment Dashboard
→ Admin clicks Approve → RPC verify_payment_and_upgrade() called
→ User subscription set to premium ✅
```

### Chapa (Telebirr / CBE Birr)
```
User selects plan → Backend calls Chapa API → Checkout URL returned
→ User redirected to Chapa payment page (new tab)
→ Chapa processes payment
→ Webhook sent to /functions/v1/chapa-payment?action=webhook
→ Webhook re-verified against Chapa API
→ verify_payment_and_upgrade() called
→ User subscription set to premium ✅
→ Frontend polling detects verification and shows success
```

---

## 🌍 Ethiopian Payment Methods

| Method | Provider | Flow |
|--------|----------|------|
| Telebirr | Chapa | Redirect checkout |
| CBE Birr | Chapa | Redirect checkout |
| Abisiniya Bank | Manual | Reference number + admin approval |
| Awash Bank | Manual | Reference number + admin approval |

---

## 📊 Admin Payment Dashboard Features

- Live payment monitoring (auto-refreshes every 15s)
- Revenue analytics with monthly bar chart
- Filter by: All / Pending / Verified / Failed / Suspicious
- Full-text search across payments
- One-click approve / reject / flag
- Fraud score display (auto-calculated)
- Webhook event log with signature validation status
- Admin note on every action (audit trail)

---

## 🗄️ Database Tables (v6 additions)

| Table | Purpose |
|-------|---------|
| `payments` | Upgraded with payment_status, verification_status, fraud_score, chapa fields |
| `payment_sessions` | Chapa checkout session tracking |
| `webhook_events` | Full webhook audit log |
| `admin_sessions` | Admin double-door session tracking |
| `login_history` | All login attempts (success + failure) |
| `ai_api_keys` | Admin-managed API key references |
| `rate_limits` | Payment rate limiting |

---

## 🚢 Deployment

The project is built for deployment on [Lovable.dev](https://lovable.dev).

For production:
1. Set all environment variables in Lovable settings
2. Set Supabase Edge Function secrets in Supabase dashboard
3. Register Chapa webhook URL: `https://your-project.supabase.co/functions/v1/chapa-payment?action=webhook`
4. Enable Google OAuth in Supabase Auth settings
5. Add your domain to Supabase Auth allowed redirect URLs
