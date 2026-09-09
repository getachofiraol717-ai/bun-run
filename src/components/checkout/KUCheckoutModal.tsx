import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { X, ShieldCheck, Lock, ArrowRight, Loader2, RefreshCw, AlertCircle, Sparkles, ExternalLink, CheckCircle2, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import {
  BillingCycle,
  BillingDetails,
  CheckoutStep,
  PaymentMethodId,
  SUPPORTED_PAYMENT_METHODS,
  AUTHORITATIVE_PLANS,
  PaymentTransactionResponse,
} from '@/types/payment';
import { PlanSelector } from './PlanSelector';
import { BillingDetailsForm } from './BillingDetailsForm';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { OrderSummary } from './OrderSummary';
import { BankTransferInstructions } from './BankTransferInstructions';
import { ReceiptCard } from './ReceiptCard';
import { PaymentReceiptData } from '@/lib/receiptGenerator';

interface KUCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlanId?: string;
  initialBillingCycle?: BillingCycle;
  onPaymentComplete?: () => void;
}

export const KUCheckoutModal: React.FC<KUCheckoutModalProps> = ({
  isOpen,
  onClose,
  initialPlanId = 'student_monthly',
  initialBillingCycle = 'monthly',
  onPaymentComplete,
}) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  // Primary Selection States
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialBillingCycle);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlanId);
  const [selectedMethodId, setSelectedMethodId] = useState<PaymentMethodId>('chapa_card');

  // Billing Details State
  const [billingDetails, setBillingDetails] = useState<BillingDetails>({
    fullName: profile?.name || '',
    email: profile?.email || user?.email || '',
    phone: profile?.phone || '',
    country: 'Ethiopia',
    taxId: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Promo Code State
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercent: number } | null>(null);

  // Workflow & State Management
  const [step, setStep] = useState<CheckoutStep>('configure');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Transaction References
  const [activeTxRef, setActiveTxRef] = useState<string | null>(null);
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
  const [chapaCheckoutUrl, setChapaCheckoutUrl] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<PaymentReceiptData | null>(null);

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollAttemptsRef = useRef<number>(0);

  // Synchronize initial plan if prop changes
  useEffect(() => {
    if (initialPlanId && AUTHORITATIVE_PLANS[initialPlanId]) {
      setSelectedPlanId(initialPlanId);
      setBillingCycle(AUTHORITATIVE_PLANS[initialPlanId].billingCycle);
    }
  }, [initialPlanId]);

  // Synchronize user profile when loaded
  useEffect(() => {
    if (profile || user) {
      setBillingDetails((prev) => ({
        ...prev,
        fullName: prev.fullName || profile?.name || '',
        email: prev.email || profile?.email || user?.email || '',
        phone: prev.phone || profile?.phone || '',
      }));
    }
  }, [profile, user]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, []);

  const currentPlan = AUTHORITATIVE_PLANS[selectedPlanId] || AUTHORITATIVE_PLANS.student_monthly;
  const currentMethod = SUPPORTED_PAYMENT_METHODS.find((m) => m.id === selectedMethodId) || SUPPORTED_PAYMENT_METHODS[0];

  // Client Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!billingDetails.fullName.trim() || billingDetails.fullName.trim().length < 2) {
      errors.fullName = 'Please enter your full name.';
    }
    if (!billingDetails.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingDetails.email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }
    const cleanPhone = billingDetails.phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      errors.phone = 'Please provide a valid Ethiopian phone number.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Promo Code Validation Handler
  const handleApplyPromo = async (code: string): Promise<{ success: boolean; message: string }> => {
    const clean = code.trim().toUpperCase();

    // Standard client discount vouchers
    const PROMO_CODES: Record<string, number> = {
      'STUDENT50': 50,
      'LEARN20': 20,
      'FREE100': 100,
      'KU2026': 100,
      'VIPSTUDENT': 100,
      'ETHIOPIA2026': 100,
    };

    if (PROMO_CODES[clean]) {
      const discount = PROMO_CODES[clean];
      setAppliedPromo({ code: clean, discountPercent: discount });
      return { success: true, message: `${clean} applied! You saved ${discount}%.` };
    }

    return { success: false, message: 'Invalid promo code. Please verify the spelling.' };
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
  };

  // Main Checkout Submission
  const handleStartCheckout = async () => {
    if (!validateForm()) {
      toast({
        title: 'Please check required fields',
        description: 'Ensure full name, valid email, and phone number are filled.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to your Knowledge Universe account to proceed.',
        variant: 'destructive',
      });
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    setStep('initiating');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      // Check if 100% voucher applied
      const supabaseEndpoint = import.meta.env.VITE_SUPABASE_URL || 'https://rhkctgaweqtgidvagssm.supabase.co';
      if (appliedPromo && appliedPromo.discountPercent === 100) {
        const res = await fetch(
          `${supabaseEndpoint}/functions/v1/chapa-payment?action=redeem_voucher`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              voucher_code: appliedPromo.code,
              plan_name: currentPlan.id,
            }),
          }
        );

        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.message || data.error || 'Failed to redeem voucher code.');
        }

        // Successfully redeemed voucher on server
        await handlePaymentSuccess(
          `VOUCHER-${appliedPromo.code}`,
          'Voucher Code Promo',
          0,
          currentPlan.name,
          currentPlan.durationDays
        );
        return;
      }

      // Standard Payment Initiation via Edge Function
      const redirectOrigin = window.location.origin;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || 'https://rhkctgaweqtgidvagssm.supabase.co'}/functions/v1/chapa-payment?action=initiate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            planName: currentPlan.id,
            paymentMethod: selectedMethodId,
            billingDetails: {
              fullName: billingDetails.fullName.trim(),
              email: billingDetails.email.trim(),
              phone: billingDetails.phone.trim(),
              country: billingDetails.country,
              taxId: billingDetails.taxId?.trim(),
            },
            redirectOrigin,
          }),
        }
      );

      const data: PaymentTransactionResponse = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.details || data.message || data.error || 'Payment initiation failed.');
      }

      setActiveTxRef(data.tx_ref || null);
      setActivePaymentId(data.payment_id || null);

      if (data.mode === 'manual' || !data.checkout_url) {
        // Direct bank transfer instructions
        setStep('bank_transfer');
      } else {
        // Chapa Online Checkout
        setChapaCheckoutUrl(data.checkout_url);
        setStep('chapa_redirect');

        // Open checkout popup/tab automatically
        const checkoutWindow = window.open(data.checkout_url, '_blank');
        if (!checkoutWindow) {
          toast({
            title: 'Popup Blocked',
            description: 'Please click "Proceed to Chapa Gateway" below to complete payment.',
          });
        }

        // Start background verification polling
        startVerificationPolling(data.tx_ref!);
      }
    } catch (err: any) {
      console.error('Checkout initiation error:', err);
      setErrorMessage(err.message || 'An unexpected payment error occurred.');
      setStep('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Background Verification Polling
  const startVerificationPolling = (txRef: string) => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    pollAttemptsRef.current = 0;

    pollingTimerRef.current = setInterval(async () => {
      pollAttemptsRef.current += 1;
      if (pollAttemptsRef.current > 40) {
        // Stop polling after 2 minutes
        if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
        return;
      }

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
          if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
          await handlePaymentSuccess(
            txRef,
            currentMethod.name,
            currentPlan.priceETB,
            currentPlan.name,
            currentPlan.durationDays
          );
        } else if (data.status === 'failed') {
          if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
          setErrorMessage('Payment was declined or cancelled by the provider.');
          setStep('failed');
        }
      } catch (pollErr) {
        console.warn('Poll error:', pollErr);
      }
    }, 3000);
  };

  // Submit Reference for Direct Bank / Telebirr Manual
  const handleSubmitManualReference = async (refNumber: string) => {
    if (!activePaymentId && !activeTxRef) {
      toast({ title: 'Error', description: 'Missing active payment session.', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Session expired');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || 'https://rhkctgaweqtgidvagssm.supabase.co'}/functions/v1/chapa-payment?action=submit_reference`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            payment_id: activePaymentId,
            reference_number: refNumber,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.message || data.error || 'Failed to submit reference.');
      }

      setStep('pending_review');
      toast({
        title: 'Reference Submitted',
        description: 'Your reference has been recorded in the KU ledger for verification.',
      });
    } catch (err: any) {
      toast({ title: 'Submission Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Successful Payment Finalizer
  const handlePaymentSuccess = async (
    txRef: string,
    methodName: string,
    amount: number,
    planName: string,
    durationDays: number
  ) => {
    // Invalidate queries to refresh subscription status everywhere
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['profiles'] }),
      queryClient.invalidateQueries({ queryKey: ['users_directory'] }),
      queryClient.invalidateQueries({ queryKey: ['payment_stats'] }),
    ]);

    const expiryDateObj = new Date();
    expiryDateObj.setDate(expiryDateObj.getDate() + durationDays);

    const receipt: PaymentReceiptData = {
      transactionId: txRef,
      referenceNumber: txRef,
      payerName: billingDetails.fullName || profile?.name || 'Valued Student',
      payerEmail: billingDetails.email || profile?.email || user?.email || '',
      planName: planName,
      amount: amount,
      currency: 'ETB',
      paymentMethod: methodName,
      paymentDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      expiryDate: expiryDateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      status: 'Verified',
    };

    setReceiptData(receipt);
    setStep('verified');
    toast({
      title: '🎉 Premium Access Activated!',
      description: `Your ${planName} is now active for ${durationDays} days.`,
    });

    if (onPaymentComplete) onPaymentComplete();
  };

  const handleManualCheckStatus = async () => {
    if (!activeTxRef) return;
    setIsProcessing(true);
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
          body: JSON.stringify({ tx_ref: activeTxRef }),
        }
      );

      const data = await res.json();
      if (data.status === 'verified' || data.payment_status === 'verified') {
        await handlePaymentSuccess(
          activeTxRef,
          currentMethod.name,
          currentPlan.priceETB,
          currentPlan.name,
          currentPlan.durationDays
        );
      } else {
        toast({
          title: 'Payment Pending',
          description: 'Payment has not been completed yet. Please finish checkout in the gateway window.',
        });
      }
    } catch {
      toast({ title: 'Check Failed', description: 'Could not reach server. Please try again.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setStep('configure');
    setErrorMessage(null);
    setActiveTxRef(null);
    setActivePaymentId(null);
    setChapaCheckoutUrl(null);
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0 bg-background border border-border/80 shadow-2xl rounded-2xl">
        <DialogTitle className="sr-only">Knowledge Universe Secure Checkout</DialogTitle>
        <DialogDescription className="sr-only">Production checkout experience for Knowledge Universe subscription plans.</DialogDescription>
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <span>Knowledge Universe Secure Checkout</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Official
                </span>
              </h2>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                256-bit TLS Encryption · Chapa Gateway & Direct Bank Ledger
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6">
          {/* STEP: CONFIGURE */}
          {step === 'configure' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Plan, Billing Info & Payment Method */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. Plan Selector */}
                <PlanSelector
                  billingCycle={billingCycle}
                  onBillingCycleChange={setBillingCycle}
                  selectedPlanId={selectedPlanId}
                  onSelectPlan={setSelectedPlanId}
                />

                {/* 2. Billing Details Form */}
                <div className="pt-2 border-t border-border/40">
                  <BillingDetailsForm
                    billingDetails={billingDetails}
                    onChange={setBillingDetails}
                    errors={validationErrors}
                  />
                </div>

                {/* 3. Payment Method Selector */}
                <div className="pt-2 border-t border-border/40">
                  <PaymentMethodSelector
                    selectedMethodId={selectedMethodId}
                    onSelectMethod={setSelectedMethodId}
                  />
                </div>
              </div>

              {/* Right Column: Sticky Order Summary & Submit Action */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                <OrderSummary
                  plan={currentPlan}
                  appliedPromo={appliedPromo}
                  onApplyPromo={handleApplyPromo}
                  onRemovePromo={handleRemovePromo}
                  isProcessing={isProcessing}
                />

                {/* Main Action Button */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleStartCheckout}
                    disabled={isProcessing}
                    className="w-full py-3 px-5 rounded-xl text-xs font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Securing Session...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue to Secure Payment</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-center text-muted-foreground">
                    By confirming, you agree to Knowledge Universe educational terms.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP: INITIATING */}
          {step === 'initiating' && (
            <div className="py-16 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
              <h3 className="font-bold text-base text-foreground">Initiating Secure Transaction...</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Establishing an encrypted session with the payment gateway. Please do not close or refresh this tab.
              </p>
            </div>
          )}

          {/* STEP: CHAPA REDIRECT & POLLING */}
          {step === 'chapa_redirect' && (
            <div className="py-8 text-center space-y-6 max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto text-primary animate-pulse">
                <ExternalLink className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground">Chapa Checkout in Progress</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Complete your payment in the Chapa gateway tab. We will automatically detect your payment confirmation.
                </p>
              </div>

              {/* Order Reference Box */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs text-left space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Reference:</span>
                  <span className="font-mono font-bold text-foreground">{activeTxRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="font-semibold text-foreground">{currentPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-bold text-primary">{currentPlan.priceETB} ETB</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-2.5">
                {chapaCheckoutUrl && (
                  <a
                    href={chapaCheckoutUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Re-open Chapa Checkout Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleManualCheckStatus}
                  disabled={isProcessing}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-background hover:bg-muted text-foreground border border-border/60 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-primary ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>I have completed payment (Check Status)</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-muted-foreground hover:text-foreground underline pt-2"
                >
                  Cancel or Choose Different Method
                </button>
              </div>
            </div>
          )}

          {/* STEP: MANUAL BANK TRANSFER */}
          {step === 'bank_transfer' && (
            <div className="max-w-xl mx-auto py-2">
              <BankTransferInstructions
                method={currentMethod}
                amount={currentPlan.priceETB}
                planName={currentPlan.name}
                txRef={activeTxRef || 'KU-PENDING'}
                onSubmitReference={handleSubmitManualReference}
                onCancel={handleReset}
                isSubmitting={isProcessing}
              />
            </div>
          )}

          {/* STEP: PENDING REVIEW */}
          {step === 'pending_review' && (
            <div className="py-10 text-center space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-full bg-amber-500/15 border-2 border-amber-500/30 flex items-center justify-center mx-auto text-amber-500">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Reference Submitted for Verification</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your payment reference is being verified in our ledger. Your premium subscription will activate automatically once confirmed.
              </p>
              <div className="p-3 rounded-lg bg-muted/40 border border-border/40 text-left text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Reference:</span>
                  <span className="font-mono font-bold text-foreground">{activeTxRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">Processing Manual Review</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-colors"
              >
                Return to Platform
              </button>
            </div>
          )}

          {/* STEP: VERIFIED & RECEIPT */}
          {step === 'verified' && receiptData && (
            <ReceiptCard
              receiptData={receiptData}
              onGoToDashboard={() => {
                onClose();
                window.location.href = '/dashboard';
              }}
            />
          )}

          {/* STEP: FAILED */}
          {step === 'failed' && (
            <div className="py-10 text-center space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-full bg-destructive/15 border-2 border-destructive/30 flex items-center justify-center mx-auto text-destructive">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Payment Unsuccessful</h3>
              <p className="text-xs text-muted-foreground">
                {errorMessage || 'We were unable to complete your transaction. No charges were made to your account.'}
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border/60 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
