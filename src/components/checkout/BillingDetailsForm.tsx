import React from 'react';
import { User, Mail, Phone, Globe, FileText, Info } from 'lucide-react';
import { BillingDetails } from '@/types/payment';

interface BillingDetailsFormProps {
  billingDetails: BillingDetails;
  onChange: (details: BillingDetails) => void;
  errors: Record<string, string>;
}

const ETHIOPIAN_REGIONS = [
  'Addis Ababa',
  'Oromia',
  'Amhara',
  'Sidama',
  'Tigray',
  'Somali',
  'Southern Nations',
  'Dire Dawa',
  'Benishangul-Gumuz',
  'Afar',
  'Gambela',
  'Harari',
  'South West Ethiopia',
  'International / Other',
];

export const BillingDetailsForm: React.FC<BillingDetailsFormProps> = ({
  billingDetails,
  onChange,
  errors,
}) => {
  const updateField = (field: keyof BillingDetails, value: string) => {
    onChange({
      ...billingDetails,
      [field]: value,
    });
  };

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-primary" />
          Billing Information
        </h3>
        <span className="text-[11px] text-muted-foreground">Required for invoice receipt</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Full Name */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1">
            Full Name <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="e.g. Abebe Bikila"
              value={billingDetails.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-background border ${
                errors.fullName ? 'border-destructive focus:ring-destructive/20' : 'border-border/60 focus:border-primary'
              } focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all`}
            />
          </div>
          {errors.fullName && <p className="text-[11px] text-destructive font-medium">{errors.fullName}</p>}
        </div>

        {/* Email Address */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1">
            Email Address <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              placeholder="e.g. abebe@gmail.com"
              value={billingDetails.email}
              onChange={(e) => updateField('email', e.target.value)}
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-background border ${
                errors.email ? 'border-destructive focus:ring-destructive/20' : 'border-border/60 focus:border-primary'
              } focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all`}
            />
          </div>
          {errors.email && <p className="text-[11px] text-destructive font-medium">{errors.email}</p>}
        </div>

        {/* Phone Number */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1">
            Phone Number (Ethiopian) <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="tel"
              placeholder="0911223344 or +251 91 122 3344"
              value={billingDetails.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-background border ${
                errors.phone ? 'border-destructive focus:ring-destructive/20' : 'border-border/60 focus:border-primary'
              } focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all`}
            />
          </div>
          {errors.phone && <p className="text-[11px] text-destructive font-medium">{errors.phone}</p>}
        </div>

        {/* Country / Region */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1">
            Country / Region <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <Globe className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={billingDetails.country}
              onChange={(e) => updateField('country', e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-background border border-border/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="Ethiopia">Ethiopia 🇪🇹</option>
              {ETHIOPIAN_REGIONS.map((region) => (
                <option key={region} value={`Ethiopia - ${region}`}>
                  Ethiopia ({region})
                </option>
              ))}
              <option value="International">International Diaspora</option>
            </select>
          </div>
        </div>

        {/* Optional Tax ID / Student ID */}
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              Tax ID / Student ID / Institution Code <span className="text-muted-foreground font-normal">(Optional)</span>
            </span>
            <span className="text-[10px] text-muted-foreground">For institutional VAT exemption</span>
          </label>
          <input
            type="text"
            placeholder="e.g. TIN-0098421 or Student ID #2026-AA"
            value={billingDetails.taxId || ''}
            onChange={(e) => updateField('taxId', e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg bg-background border border-border/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>
    </div>
  );
};
