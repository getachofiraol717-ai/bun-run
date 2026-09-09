import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import GalaxyBackground from '@/components/GalaxyBackground';
import SEO from '@/components/SEO';
import {
  Check, X, Crown, Sparkles, Building2, CreditCard, Loader2,
  AlertCircle, Clock, ShieldCheck, Download, ArrowRight,
  GraduationCap, BookOpen, School, HelpCircle, PhoneCall, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BillingCycle, PlanConfig, AUTHORITATIVE_PLANS } from '@/types/payment';
import { KUCheckoutModal } from '@/components/checkout/KUCheckoutModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { downloadPaymentReceipt, PaymentReceiptData } from '@/lib/receiptGenerator';

export default function Pricing() {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // State
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activePlanId, setActivePlanId] = useState<string>('student_yearly');

  // Post-redirect verification state
  const [isVerifyingReturn, setIsVerifyingReturn] = useState(false);
  const [verifiedReceipt, setVerifiedReceipt] = useState<PaymentReceiptData | null>(null);

  // Check URL parameters for return flow or deep links
  useEffect(() => {
    const planParam = searchParams.get('plan');
    const paymentStatus = searchParams.get('payment_status');
    const txRef = searchParams.get('tx_ref');

    // Deep link directly to a plan checkout
    if (planParam && AUTHORITATIVE_PLANS[planParam]) {
      setActivePlanId(planParam);
      setBillingCycle(AUTHORITATIVE_PLANS[planParam].billingCycle);
      setIsCheckoutOpen(true);
    }

    // Handle return from Chapa redirect
    if (paymentStatus === 'success' && txRef) {
      verifyReturnTransaction(txRef);
    }
  }, [searchParams]);

  // Server-authoritative verification on return
  const verifyReturnTransaction = async (txRef: string) => {
    setIsVerifyingReturn(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || 'https://rhkctgaweqtgidvagssm.supabase.co'}/functions/v1/chapa-payment?action=verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ tx_ref: txRef }),
        }
      );

      const data = await res.json();
      if (data.status === 'verified' || data.payment_status === 'verified') {
        const expiryDateObj = new Date();
        expiryDateObj.setDate(expiryDateObj.getDate() + 30);

        setVerifiedReceipt({
          transactionId: txRef,
          referenceNumber: txRef,
          payerName: profile?.name || 'Valued Learner',
          payerEmail: profile?.email || user?.email || '',
          planName: 'Student Premium',
          amount: 100,
          currency: 'ETB',
          paymentMethod: 'Chapa Gateway',
          paymentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          expiryDate: expiryDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          status: 'Verified',
        });

        toast({
          title: '🎉 Payment Verified Successfully!',
          description: 'Your premium membership has been updated on the server.',
        });
      } else {
        toast({
          title: 'Payment Processing',
          description: 'Your payment verification is being processed.',
        });
      }
    } catch (err) {
      console.warn('Return verification poll error:', err);
    } finally {
      setIsVerifyingReturn(false);
      // Clean query params
      setSearchParams({});
    }
  };

  const handleOpenCheckout = (planId: string) => {
    if (!user) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in or create an account to activate your subscription.',
      });
      navigate('/login?redirect=/pricing');
      return;
    }

    setActivePlanId(planId);
    setIsCheckoutOpen(true);
  };

  const isCurrentPlanActive = (planTier: string) => {
    if (profile?.subscription === 'premium') {
      if (planTier === 'student' && profile?.role === 'student') return true;
      if (planTier === 'teacher' && profile?.role === 'teacher') return true;
      if (planTier === 'school' && profile?.role === 'school') return true;
    }
    return false;
  };

  return (
    <div className="min-h-screen relative bg-background text-foreground overflow-x-hidden">
      <GalaxyBackground />
      <SEO
        title="Knowledge Universe — Subscription Plans & Pricing"
        description="Choose the right plan for your academic journey. Ethiopian curriculum books, unlimited AI Tutor, and national exam prep."
        path="/pricing"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 space-y-16">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ethiopian Digital Education Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground font-orbitron">
            Simple, Transparent <span className="text-primary">Learning Plans</span>
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Empower your studies with full access to Ethiopian Grade 9 curriculum books, 3D interactive reader, unlimited AI Tutor assistance, and national practice quizzes.
          </p>

          {/* Monthly / Annual Toggle Switch */}
          <div className="pt-4 flex items-center justify-center">
            <div className="inline-flex items-center p-1.5 rounded-2xl bg-muted/70 dark:bg-slate-900/80 border border-border/60 shadow-xs">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  billingCycle === 'monthly'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
                  billingCycle === 'yearly'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>Annual Billing</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Verified Receipt Banner (if returned from gateway) */}
        {verifiedReceipt && (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 max-w-3xl mx-auto text-center space-y-4 animate-fade-in shadow-md">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Payment Confirmed & Verified!</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Transaction ID: <span className="font-mono text-foreground font-semibold">{verifiedReceipt.referenceNumber}</span> · Access is active until {verifiedReceipt.expiryDate}.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadPaymentReceipt(verifiedReceipt)}
                className="gap-1.5 text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF Receipt
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="gap-1.5 text-xs font-semibold"
              >
                Go to Learning Hub <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {/* 1. Student Pass */}
          {(() => {
            const plan = billingCycle === 'monthly' ? AUTHORITATIVE_PLANS.student_monthly : AUTHORITATIVE_PLANS.student_yearly;
            const isCurrent = isCurrentPlanActive('student');

            return (
              <div className="relative rounded-3xl p-6 sm:p-8 bg-card border border-border/80 shadow-md flex flex-col justify-between hover:border-primary/50 transition-all duration-200">
                {plan.badge && (
                  <span className="absolute -top-3 right-6 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary text-primary-foreground shadow-xs">
                    {plan.badge}
                  </span>
                )}

                <div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <GraduationCap className="w-5 h-5" />
                  </div>

                  <h2 className="text-xl font-extrabold text-foreground font-orbitron">{plan.name}</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Complete curriculum access and AI tutoring for Ethiopian students.
                  </p>

                  <div className="my-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-foreground">{plan.priceETB.toLocaleString()}</span>
                      <span className="text-sm font-bold text-muted-foreground">ETB</span>
                      <span className="text-xs text-muted-foreground">
                        / {billingCycle === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                        ~{plan.monthlyEquivalentETB} ETB/month (Save 240 ETB/year)
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 pt-4 border-t border-border/60">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <Button
                    onClick={() => handleOpenCheckout(plan.id)}
                    className="w-full py-6 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-sm"
                  >
                    {isCurrent ? 'Current Active Plan' : 'Get Student Pass'}
                  </Button>
                </div>
              </div>
            );
          })()}

          {/* 2. Educator Pass */}
          {(() => {
            const plan = billingCycle === 'monthly' ? AUTHORITATIVE_PLANS.teacher_monthly : AUTHORITATIVE_PLANS.teacher_yearly;
            const isCurrent = isCurrentPlanActive('teacher');

            return (
              <div className="relative rounded-3xl p-6 sm:p-8 bg-card border-2 border-primary ring-4 ring-primary/10 shadow-xl flex flex-col justify-between">
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary text-primary-foreground shadow-sm">
                  Recommended for Teachers
                </span>

                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center mb-4">
                    <BookOpen className="w-5 h-5" />
                  </div>

                  <h2 className="text-xl font-extrabold text-foreground font-orbitron">{plan.name}</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lesson blueprints, question sheet generator, and class performance tracking.
                  </p>

                  <div className="my-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-foreground">{plan.priceETB.toLocaleString()}</span>
                      <span className="text-sm font-bold text-muted-foreground">ETB</span>
                      <span className="text-xs text-muted-foreground">
                        / {billingCycle === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                        ~{plan.monthlyEquivalentETB} ETB/month (Save 360 ETB/year)
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 pt-4 border-t border-border/60">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <Button
                    onClick={() => handleOpenCheckout(plan.id)}
                    className="w-full py-6 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-sm"
                  >
                    {isCurrent ? 'Current Active Plan' : 'Get Educator Pass'}
                  </Button>
                </div>
              </div>
            );
          })()}

          {/* 3. School Institutional */}
          {(() => {
            const plan = AUTHORITATIVE_PLANS.school_yearly;
            const isCurrent = isCurrentPlanActive('school');

            return (
              <div className="relative rounded-3xl p-6 sm:p-8 bg-card border border-border/80 shadow-md flex flex-col justify-between hover:border-primary/50 transition-all duration-200">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center mb-4">
                    <School className="w-5 h-5" />
                  </div>

                  <h2 className="text-xl font-extrabold text-foreground font-orbitron">{plan.name}</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Complete digital school license for unlimited students, staff, and analytics.
                  </p>

                  <div className="my-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-foreground">{plan.priceETB.toLocaleString()}</span>
                      <span className="text-sm font-bold text-muted-foreground">ETB</span>
                      <span className="text-xs text-muted-foreground">/ year</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      365 days unlimited institutional license
                    </p>
                  </div>

                  <ul className="space-y-3 pt-4 border-t border-border/60">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <Button
                    onClick={() => handleOpenCheckout(plan.id)}
                    variant="outline"
                    className="w-full py-6 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-xs"
                  >
                    {isCurrent ? 'Current Active Plan' : 'Get School License'}
                  </Button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Trust Badges Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-5xl mx-auto p-6 rounded-2xl bg-muted/40 dark:bg-slate-900/60 border border-border/60 text-center">
          <div className="space-y-1">
            <ShieldCheck className="w-5 h-5 text-emerald-500 mx-auto" />
            <p className="font-bold text-xs text-foreground">Chapa Verified</p>
            <p className="text-[11px] text-muted-foreground">National Gateway Security</p>
          </div>
          <div className="space-y-1">
            <CreditCard className="w-5 h-5 text-primary mx-auto" />
            <p className="font-bold text-xs text-foreground">Telebirr & CBE Birr</p>
            <p className="text-[11px] text-muted-foreground">All Ethiopian Wallets</p>
          </div>
          <div className="space-y-1">
            <Clock className="w-5 h-5 text-amber-500 mx-auto" />
            <p className="font-bold text-xs text-foreground">Instant Activation</p>
            <p className="text-[11px] text-muted-foreground">Server Automated Upgrade</p>
          </div>
          <div className="space-y-1">
            <Download className="w-5 h-5 text-blue-500 mx-auto" />
            <p className="font-bold text-xs text-foreground">Official PDF Invoices</p>
            <p className="text-[11px] text-muted-foreground">Tax & Audit Compliant</p>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto space-y-6 pt-6">
          <div className="text-center space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold font-orbitron text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-muted-foreground">
              Everything you need to know about payment methods and access terms.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-card border border-border/60 space-y-1">
              <h3 className="font-bold text-xs text-foreground">How soon is my premium access activated?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When paying via Chapa (Debit cards, Telebirr, CBE Birr), access is activated instantly via automated server webhooks. For manual bank transfers, activation occurs once the reference is verified.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border/60 space-y-1">
              <h3 className="font-bold text-xs text-foreground">Can I download books for offline reading?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Yes! All premium members can download full curriculum textbooks in high-resolution PDF format and sync them for offline study in the web app or Android APK.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border/60 space-y-1">
              <h3 className="font-bold text-xs text-foreground">Are official receipts provided for tax or institutional reimbursement?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Yes! Every verified transaction generates an official downloadable PDF receipt containing transaction references, dates, subscriber details, and platform credentials.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Checkout Modal Component */}
      <KUCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        initialPlanId={activePlanId}
        initialBillingCycle={billingCycle}
        onPaymentComplete={() => {
          // Refetch user status
        }}
      />
    </div>
  );
}
