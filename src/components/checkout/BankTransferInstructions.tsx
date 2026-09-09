import React, { useState } from 'react';
import { Copy, Check, Building2, AlertCircle, Smartphone, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { PaymentMethodOption, SUPPORTED_PAYMENT_METHODS } from '@/types/payment';

interface BankTransferInstructionsProps {
  method: PaymentMethodOption;
  amount: number;
  planName: string;
  txRef: string;
  onSubmitReference: (refNumber: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const BankTransferInstructions: React.FC<BankTransferInstructionsProps> = ({
  method,
  amount,
  planName,
  txRef,
  onSubmitReference,
  onCancel,
  isSubmitting = false,
}) => {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceNumber.trim()) {
      setError('Please enter your transaction reference number.');
      return;
    }
    if (referenceNumber.trim().length < 6) {
      setError('Reference number is too short. Please verify the code on your SMS or receipt.');
      return;
    }
    setError('');
    await onSubmitReference(referenceNumber.trim());
  };

  return (
    <div className="space-y-4">
      {/* Transfer Header Card */}
      <div className="p-4 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">Amount to Transfer:</span>
          <span className="text-base font-extrabold text-primary">{amount.toLocaleString()} ETB</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Plan:</span>
          <span className="font-semibold text-foreground">{planName}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>KU Order Tracking Ref:</span>
          <span className="font-mono text-[11px] font-semibold text-foreground">{txRef}</span>
        </div>
      </div>

      {/* Account Details Box */}
      <div className="space-y-2.5 p-4 rounded-xl bg-card border border-border/60">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-primary" />
          Official Recipient Account Details
        </h4>

        {method.accountName && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-xs">
            <span className="text-muted-foreground">Account Name:</span>
            <span className="font-semibold text-foreground">{method.accountName}</span>
          </div>
        )}

        {method.accountNumber && (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/60 border border-border/60 text-xs">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Account / Phone Number</p>
              <p className="font-mono text-sm font-bold text-foreground">{method.accountNumber}</p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(method.accountNumber!, 'acc')}
              className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-background hover:bg-muted text-foreground border border-border/60 flex items-center gap-1 transition-colors"
            >
              {copiedField === 'acc' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}

        {method.ussdCode && (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 text-xs">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Quick USSD Code</p>
              <p className="font-mono font-bold text-foreground">{method.ussdCode}</p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(method.ussdCode!, 'ussd')}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-background hover:bg-muted text-foreground border border-border/60 flex items-center gap-1"
            >
              {copiedField === 'ussd' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copiedField === 'ussd' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}

        {method.instructions && (
          <div className="p-2.5 rounded-lg bg-muted/30 text-[11px] text-muted-foreground leading-relaxed">
            {method.instructions}
          </div>
        )}
      </div>

      {/* Reference Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-3 pt-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>Enter Transaction Reference / Confirmation Number <span className="text-destructive">*</span></span>
          </label>
          <input
            type="text"
            placeholder="e.g. FT2608394982 or TB19283746"
            value={referenceNumber}
            onChange={(e) => {
              setReferenceNumber(e.target.value.toUpperCase());
              setError('');
            }}
            disabled={isSubmitting}
            className="w-full px-3 py-2.5 text-xs font-mono rounded-lg bg-background border border-border/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 uppercase transition-all"
          />
          <p className="text-[11px] text-muted-foreground">
            Found on your bank SMS confirmation, Telebirr receipt, or mobile banking transaction slip.
          </p>
        </div>

        {error && (
          <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border/60 transition-colors"
          >
            Back / Change Method
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !referenceNumber.trim()}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Submitting Reference...</span>
            ) : (
              <>
                <span>Submit for Verification</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
