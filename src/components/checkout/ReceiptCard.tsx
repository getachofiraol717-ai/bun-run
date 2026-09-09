import React from 'react';
import { CheckCircle2, Download, ShieldCheck, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { downloadPaymentReceipt, PaymentReceiptData } from '@/lib/receiptGenerator';

interface ReceiptCardProps {
  receiptData: PaymentReceiptData;
  onGoToDashboard: () => void;
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({
  receiptData,
  onGoToDashboard,
}) => {
  const handleDownload = () => {
    downloadPaymentReceipt(receiptData);
  };

  return (
    <div className="text-center py-4 space-y-5">
      {/* Verification Icon */}
      <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-500 animate-fade-in shadow-sm">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div>
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          Payment Verified & Active
        </span>
        <h3 className="text-xl font-extrabold text-foreground mt-2">
          Welcome to {receiptData.planName}!
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
          Your subscription is now active with full access to Ethiopian curriculum books, unlimited AI Tutor, and study tools.
        </p>
      </div>

      {/* Receipt Info Card */}
      <div className="max-w-md mx-auto p-4 rounded-xl bg-muted/40 dark:bg-slate-900/80 border border-border/60 text-left space-y-2.5 text-xs">
        <div className="flex justify-between pb-2 border-b border-border/40">
          <span className="text-muted-foreground">Transaction ID / Ref:</span>
          <span className="font-mono font-semibold text-foreground">{receiptData.referenceNumber || receiptData.transactionId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subscriber:</span>
          <span className="font-semibold text-foreground">{receiptData.payerName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Amount Paid:</span>
          <span className="font-bold text-foreground">{receiptData.amount} {receiptData.currency}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Payment Method:</span>
          <span className="font-medium text-foreground">{receiptData.paymentMethod}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Verified Date:</span>
          <span className="font-medium text-foreground">{receiptData.paymentDate}</span>
        </div>
        {receiptData.expiryDate && (
          <div className="flex justify-between pt-2 border-t border-border/40 text-emerald-600 dark:text-emerald-400 font-semibold">
            <span>Valid Until:</span>
            <span>{receiptData.expiryDate}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
        <button
          type="button"
          onClick={handleDownload}
          className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-background hover:bg-muted text-foreground border border-border/60 shadow-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-primary" />
          <span>Download Official PDF Receipt</span>
        </button>

        <button
          type="button"
          onClick={onGoToDashboard}
          className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>Go to Learning Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
