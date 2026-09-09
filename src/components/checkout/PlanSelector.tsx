import React from 'react';
import { Check, Sparkles, ShieldCheck, School, GraduationCap, BookOpen } from 'lucide-react';
import { BillingCycle, PlanConfig, AUTHORITATIVE_PLANS } from '@/types/payment';

interface PlanSelectorProps {
  billingCycle: BillingCycle;
  onBillingCycleChange: (cycle: BillingCycle) => void;
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
}

export const PlanSelector: React.FC<PlanSelectorProps> = ({
  billingCycle,
  onBillingCycleChange,
  selectedPlanId,
  onSelectPlan,
}) => {
  const currentPlans = [
    billingCycle === 'monthly' ? AUTHORITATIVE_PLANS.student_monthly : AUTHORITATIVE_PLANS.student_yearly,
    billingCycle === 'monthly' ? AUTHORITATIVE_PLANS.teacher_monthly : AUTHORITATIVE_PLANS.teacher_yearly,
    AUTHORITATIVE_PLANS.school_yearly,
  ];

  return (
    <div className="space-y-4">
      {/* Billing Cycle Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-muted/60 dark:bg-slate-900/80 rounded-xl border border-border/60">
        <div className="text-xs font-semibold text-muted-foreground px-2">
          Select Billing Frequency:
        </div>
        <div className="inline-flex items-center p-1 rounded-lg bg-background shadow-xs border border-border/40">
          <button
            type="button"
            onClick={() => {
              onBillingCycleChange('monthly');
              if (selectedPlanId.includes('student')) onSelectPlan('student_monthly');
              else if (selectedPlanId.includes('teacher')) onSelectPlan('teacher_monthly');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
              billingCycle === 'monthly'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => {
              onBillingCycleChange('yearly');
              if (selectedPlanId.includes('student')) onSelectPlan('student_yearly');
              else if (selectedPlanId.includes('teacher')) onSelectPlan('teacher_yearly');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 ${
              billingCycle === 'yearly'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Annual Billing</span>
            <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {currentPlans.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          const isPopular = plan.popular;

          return (
            <div
              key={plan.id}
              onClick={() => onSelectPlan(plan.id)}
              className={`relative cursor-pointer rounded-xl p-4 transition-all duration-200 border text-left flex flex-col justify-between ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10 shadow-sm'
                  : 'border-border/60 hover:border-border hover:bg-muted/30 bg-card'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground shadow-xs">
                  {plan.badge}
                </span>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {plan.tier === 'student' && <GraduationCap className="w-4 h-4 text-primary" />}
                    {plan.tier === 'teacher' && <BookOpen className="w-4 h-4 text-amber-500" />}
                    {plan.tier === 'school' && <School className="w-4 h-4 text-purple-500" />}
                    <h3 className="font-bold text-sm text-foreground">{plan.name}</h3>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/40 bg-transparent'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>

                <div className="my-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-foreground">{plan.priceETB.toLocaleString()}</span>
                    <span className="text-xs font-semibold text-muted-foreground">ETB</span>
                    <span className="text-[11px] text-muted-foreground">
                      / {plan.billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                  {plan.billingCycle === 'yearly' && plan.tier !== 'school' && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Equivalent to ~{plan.monthlyEquivalentETB} ETB/month (Save 20%)
                    </p>
                  )}
                  {plan.tier === 'school' && (
                    <p className="text-[11px] text-muted-foreground">
                      Covers entire school institution (365 days)
                    </p>
                  )}
                </div>

                <ul className="space-y-1.5 mt-3 pt-3 border-t border-border/40">
                  {plan.features.slice(0, 4).map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
