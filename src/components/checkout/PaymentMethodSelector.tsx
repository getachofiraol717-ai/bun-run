import React from 'react';
import { CreditCard, Smartphone, Building2, ShieldCheck, Check, AlertCircle, Sparkles } from 'lucide-react';
import { PaymentMethodId, SUPPORTED_PAYMENT_METHODS, PaymentMethodOption } from '@/types/payment';

interface PaymentMethodSelectorProps {
  selectedMethodId: PaymentMethodId;
  onSelectMethod: (methodId: PaymentMethodId) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethodId,
  onSelectMethod,
}) => {
  const getIcon = (type: PaymentMethodOption['iconType']) => {
    switch (type) {
      case 'card':
        return <CreditCard className="w-5 h-5 text-primary" />;
      case 'telebirr':
        return <Smartphone className="w-5 h-5 text-emerald-500" />;
      case 'cbe':
        return <Building2 className="w-5 h-5 text-amber-500" />;
      case 'bank':
        return <Building2 className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-primary" />
          Select Payment Method
        </h3>
        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> 256-bit Encrypted
        </span>
      </div>

      <div className="space-y-2">
        {SUPPORTED_PAYMENT_METHODS.map((method) => {
          const isSelected = selectedMethodId === method.id;

          return (
            <div
              key={method.id}
              onClick={() => onSelectMethod(method.id)}
              className={`cursor-pointer rounded-xl p-3.5 transition-all duration-150 border flex items-center justify-between gap-3 ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10 shadow-xs'
                  : 'border-border/60 hover:border-border hover:bg-muted/30 bg-card'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                    isSelected
                      ? 'border-primary/40 bg-background shadow-xs'
                      : 'border-border/40 bg-muted/50'
                  }`}
                >
                  {getIcon(method.iconType)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs text-foreground truncate">{method.name}</span>
                    {method.badge && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          method.isInstant
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {method.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{method.subtitle}</p>
                </div>
              </div>

              <div
                className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/40 bg-transparent'
                }`}
              >
                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Production Gateway & Google Pay Notice */}
      <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 text-[11px] text-muted-foreground flex items-start gap-2">
        <AlertCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <span>
            Automated transactions are secured via <strong>Chapa Financial Technologies</strong>.
            Google Pay & Apple Pay are international wallet protocols and will only be displayed when active on the merchant processor for cross-border cards.
          </span>
        </div>
      </div>
    </div>
  );
};
