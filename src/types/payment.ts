export type BillingCycle = 'monthly' | 'yearly';

export type PlanTier = 'student' | 'teacher' | 'school';

export interface PlanConfig {
  id: string;
  tier: PlanTier;
  billingCycle: BillingCycle;
  name: string;
  title: string;
  priceETB: number;
  monthlyEquivalentETB: number;
  durationDays: number;
  discountPercent?: number;
  badge?: string;
  popular?: boolean;
  features: Array<{ text: string; included: boolean }>;
}

export interface BillingDetails {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  taxId?: string;
}

export type PaymentMethodId = 'chapa_card' | 'telebirr' | 'cbe_birr' | 'bank_boa' | 'bank_awash';

export interface PaymentMethodOption {
  id: PaymentMethodId;
  name: string;
  provider: 'chapa' | 'manual';
  subtitle: string;
  iconType: 'card' | 'telebirr' | 'cbe' | 'bank';
  badge?: string;
  isInstant: boolean;
  instructions?: string;
  accountNumber?: string;
  accountName?: string;
  ussdCode?: string;
}

export type CheckoutStep =
  | 'configure'       // plan + billing info + method
  | 'initiating'      // calling backend to create tx
  | 'chapa_redirect'  // waiting for Chapa checkout in popup/window
  | 'bank_transfer'   // submitting manual bank reference
  | 'pending_review'  // reference submitted, waiting for verification
  | 'polling'         // polling backend status
  | 'verified'        // success confirmed by backend
  | 'failed';         // payment or verification failed

export interface PaymentTransactionResponse {
  success: boolean;
  mode?: 'redirect' | 'manual';
  checkout_url?: string;
  tx_ref?: string;
  payment_id?: string;
  message?: string;
  error?: string;
  details?: string;
  reused?: boolean;
}

export const AUTHORITATIVE_PLANS: Record<string, PlanConfig> = {
  student_monthly: {
    id: 'student_monthly',
    tier: 'student',
    billingCycle: 'monthly',
    name: 'Student Monthly Pass',
    title: 'Student Premium',
    priceETB: 100,
    monthlyEquivalentETB: 100,
    durationDays: 30,
    features: [
      { text: 'All Grade 9 Ethiopian Textbooks & 3D Reader', included: true },
      { text: 'Download Full PDF Books with Cover Pages', included: true },
      { text: 'Unlimited AI Tutor Voice & Chat', included: true },
      { text: 'Dual AI Agent Studio Image Generator', included: true },
      { text: 'All Curriculum Practice Exams & Quizzes', included: true },
      { text: '30-Day Verified Learning Certificate', included: true },
    ],
  },
  student_yearly: {
    id: 'student_yearly',
    tier: 'student',
    billingCycle: 'yearly',
    name: 'Student Annual Pass',
    title: 'Student Premium (Yearly)',
    priceETB: 960,
    monthlyEquivalentETB: 80,
    durationDays: 365,
    discountPercent: 20,
    badge: 'SAVE 20%',
    popular: true,
    features: [
      { text: 'All Student Monthly Features Included', included: true },
      { text: '365-Day Continuous Unlimited Access', included: true },
      { text: 'Priority Offline Book Synchronization', included: true },
      { text: 'National Exam Preparation Question Vaults', included: true },
      { text: 'Annual Academic Achievement Certificate', included: true },
      { text: 'Save 240 ETB compared to monthly', included: true },
    ],
  },
  teacher_monthly: {
    id: 'teacher_monthly',
    tier: 'teacher',
    billingCycle: 'monthly',
    name: 'Educator Monthly Pass',
    title: 'Teacher Premium',
    priceETB: 150,
    monthlyEquivalentETB: 150,
    durationDays: 30,
    features: [
      { text: 'All Student Premium Features Included', included: true },
      { text: 'Teacher Guides & Lesson Blueprints', included: true },
      { text: 'Upload Custom Curriculum & Classroom Materials', included: true },
      { text: 'AI Question & Exam Sheet Builder', included: true },
      { text: 'Student Analytics & Class Activity Reports', included: true },
    ],
  },
  teacher_yearly: {
    id: 'teacher_yearly',
    tier: 'teacher',
    billingCycle: 'yearly',
    name: 'Educator Annual Pass',
    title: 'Teacher Premium (Yearly)',
    priceETB: 1440,
    monthlyEquivalentETB: 120,
    durationDays: 365,
    discountPercent: 20,
    badge: 'SAVE 20%',
    features: [
      { text: 'All Educator Monthly Features Included', included: true },
      { text: '365-Day Unlimited Class License', included: true },
      { text: 'Batch Student Performance Export (CSV/PDF)', included: true },
      { text: 'Save 360 ETB compared to monthly', included: true },
      { text: 'Priority Educator Onboarding & Helpdesk', included: true },
    ],
  },
  school_yearly: {
    id: 'school_yearly',
    tier: 'school',
    billingCycle: 'yearly',
    name: 'School Institutional Pass',
    title: 'School License',
    priceETB: 10000,
    monthlyEquivalentETB: 833,
    durationDays: 365,
    badge: 'INSTITUTIONAL',
    features: [
      { text: 'Unlimited Student Accounts for Entire School', included: true },
      { text: 'Unlimited Teacher Licenses & Staff Hub', included: true },
      { text: 'Dedicated School Admin Dashboard & LMS', included: true },
      { text: 'All Ethiopian Curriculum Modules & Quizzes', included: true },
      { text: 'Dedicated 24/7 Technical Support & Training', included: true },
    ],
  },
};

export const SUPPORTED_PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'chapa_card',
    name: 'Online Cards & Checkout',
    provider: 'chapa',
    subtitle: 'Ethiopian Debit Cards, Visa, Mastercard via Chapa Gateway',
    iconType: 'card',
    badge: 'Instant Automated',
    isInstant: true,
    instructions: 'Encrypted checkout powered by Chapa. Access is activated immediately upon successful payment.',
  },
  {
    id: 'telebirr',
    name: 'Telebirr (Ethio Telecom)',
    provider: 'chapa',
    subtitle: 'Instant Mobile Wallet (*127#) or Direct Merchant Transfer',
    iconType: 'telebirr',
    badge: 'Most Popular',
    isInstant: true,
    accountNumber: '0911223344',
    accountName: 'Knowledge Universe EdTech',
    ussdCode: '*127#',
    instructions: 'Open your Telebirr app or dial *127# -> Select "Send Money" or "Pay Merchant" -> Enter number 0911223344 -> Complete transaction and copy your Transaction Reference ID.',
  },
  {
    id: 'cbe_birr',
    name: 'CBE Birr & CBE Mobile Banking',
    provider: 'chapa',
    subtitle: 'Commercial Bank of Ethiopia (*806#) / Mobile Transfer',
    iconType: 'cbe',
    badge: 'Direct Bank Transfer',
    isInstant: true,
    accountNumber: '1000458923412',
    accountName: 'Knowledge Universe Education Hub',
    ussdCode: '*806#',
    instructions: 'Transfer via CBE Mobile Banking or dial *806# to Account 1000458923412. Enter your payment FT reference code.',
  },
  {
    id: 'bank_boa',
    name: 'Bank of Abyssinia (Apollo)',
    provider: 'manual',
    subtitle: 'BoA Mobile Banking / Apollo App Transfer',
    iconType: 'bank',
    badge: 'Manual Review',
    isInstant: false,
    accountNumber: '89234120',
    accountName: 'Knowledge Universe Digital',
    instructions: 'Transfer to Bank of Abyssinia Account 89234120 via Apollo or BoA Mobile App, then enter your transaction confirmation number.',
  },
  {
    id: 'bank_awash',
    name: 'Awash Bank (Awash Birr Pro)',
    provider: 'manual',
    subtitle: 'Awash Mobile Banking & Birr Pro Transfer',
    iconType: 'bank',
    badge: 'Manual Review',
    isInstant: false,
    accountNumber: '01320492819200',
    accountName: 'Knowledge Universe Hub',
    instructions: 'Transfer to Awash Bank Account 01320492819200 and submit your transaction reference code for verification.',
  },
];
