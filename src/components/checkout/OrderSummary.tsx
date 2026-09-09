import React, { useState } from 'react';
import { ShieldCheck, Tag, CheckCircle2, Clock, Sparkles, AlertCircle } from 'lucide-react';
import { PlanConfig } from '@/types/payment';

interface OrderSummaryProps {
  plan: PlanConfig;
  appliedPromo: { code: string; discountPercent: number } | null;
  onApplyPromo: (code: string) => Promise<{ success: boolean; message: string }>;
  onRemovePromo: () => void;
  isProcessing?: boolean;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  plan,
  appliedPromo,
  onApplyPromo,
  onRemovePromo,
  isProcessing = false,
}) => {
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const subtotal = plan.priceETB;
  const promoDiscountAmount = appliedPromo
    ? Math.round((subtotal * appliedPromo.discountPercent) / 100)
    : 0;
  const totalDue = Math.max(0, subtotal - promoDiscountAmount);

  const handleApplyPromoCode = async () => {
    if (!promoInput.trim()) return;
    setPromoError('');
    setPromoSuccess('');
    setIsApplying(true);

    try {
      const res = await onApplyPromo(promoInput.trim().toUpperCase());
      if (res.success) {
        setPromoSuccess(res.message || 'Promo code applied!');
        setPromoInput('');
      } else {
        setPromoError(res.message || 'Invalid or expired promo code.');
      }
    } catch {
      setPromoError('Unable to apply promo code. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="bg-muted/40 dark:bg-slate-900/60 rounded-2xl p-5 border border-border/60 flex flex-col justify-between space-y-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div>
            <h3 className="font-bold text-sm text-foreground">Order Summary</h3>
            <p className="text-[11px] text-muted-foreground">Knowledge Universe Subscription</p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
            {plan.billingCycle === 'yearly' ? 'Annual Plan' : 'Monthly Plan'}
          </span>
        </div>

        {/* Selected Plan Details */}
        <div className="flex items-start justify-between gap-2 py-1">
          <div>
            <p className="font-semibold text-xs text-foreground">{plan.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {plan.durationDays} Days Unlimited Platform Access
            </p>
          </div>
          <p className="font-bold text-xs text-foreground shrink-0">
            {subtotal.toLocaleString()} ETB
          </p>
        </div>

        {/* Promo Code Input or Applied Badge */}
        <div className="pt-2 border-t border-border/40">
          {appliedPromo ? (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-emerald-500" />
                <div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {appliedPromo.code}
                  </span>
                  <span className="text-[11px] text-muted-foreground ml-1.5">
                    ({appliedPromo.discountPercent}% OFF)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onRemovePromo}
                disabled={isProcessing}
                className="text-[11px] text-muted-foreground hover:text-destructive underline font-medium"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo or Voucher Code"
                  value={promoInput}
                  onChange={(e) => {
                    setPromoInput(e.target.value.toUpperCase());
                    setPromoError('');
                  }}
                  disabled={isProcessing || isApplying}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-background border border-border/60 focus:border-primary focus:outline-none uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyPromoCode}
                  disabled={!promoInput.trim() || isProcessing || isApplying}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border/60 disabled:opacity-50 transition-colors shrink-0"
                >
                  {isApplying ? 'Applying...' : 'Apply'}
                </button>
              </div>
              {promoError && (
                <p className="text-[11px] text-destructive flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" /> {promoError}
                </p>
              )}
              {promoSuccess && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> {promoSuccess}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Pricing Breakdown */}
        <div className="space-y-2 pt-2 border-t border-border/40 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{subtotal.toLocaleString()} ETB</span>
          </div>

          {promoDiscountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
              <span>Promo Discount ({appliedPromo?.discountPercent}%)</span>
              <span>-{promoDiscountAmount.toLocaleString()} ETB</span>
            </div>
          )}

          <div className="flex justify-between text-muted-foreground">
            <span>Processing & Taxes (0% VAT)</span>
            <span>0.00 ETB</span>
          </div>

          <div className="pt-2 border-t border-border/60 flex justify-between items-baseline">
            <span className="font-bold text-sm text-foreground">Total Due Today</span>
            <div className="text-right">
              <span className="font-extrabold text-xl text-primary">{totalDue.toLocaleString()}</span>
              <span className="text-xs font-bold text-primary ml-1">ETB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Guarantee */}
      <div className="pt-4 border-t border-border/40 space-y-2">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Official Ethiopian Learning Platform receipt provided</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>Instant activation upon payment verification</span>
        </div>
      </div>
    </div>
  );
};
