import React from 'react';

interface Country {
  code: string;
  name: string;
  placeholder: string;
  min: number;
  max: number;
}

const COUNTRIES: Country[] = [
  { code: '+251', name: 'Ethiopia', placeholder: '9XXXXXXXX', min: 9, max: 9 },
  { code: '+1', name: 'USA', placeholder: '2015550123', min: 10, max: 10 },
  { code: '+44', name: 'UK', placeholder: '7700900000', min: 10, max: 10 },
  { code: '+254', name: 'Kenya', placeholder: '712345678', min: 9, max: 9 },
  { code: '+27', name: 'South Africa', placeholder: '831234567', min: 9, max: 9 },
  { code: '+91', name: 'India', placeholder: '9876543210', min: 10, max: 10 },
  { code: '+234', name: 'Nigeria', placeholder: '8012345678', min: 7, max: 10 },
  { code: '+255', name: 'Tanzania', placeholder: '712345678', min: 9, max: 9 },
];

const DEFAULT_COUNTRY = '+251';

function parseFullPhone(value: string): { country: string; national: string } {
  const trimmed = (value || '').trim();
  if (!trimmed) return { country: DEFAULT_COUNTRY, national: '' };

  const sorted = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);
  for (const c of sorted) {
    if (trimmed.startsWith(c.code)) {
      return { country: c.code, national: trimmed.slice(c.code.length).replace(/\D/g, '') };
    }
  }

  if (trimmed.startsWith('+')) {
    return { country: DEFAULT_COUNTRY, national: trimmed.replace(/^\+/, '').replace(/\D/g, '') };
  }

  return { country: DEFAULT_COUNTRY, national: trimmed.replace(/\D/g, '') };
}

/** Strip leading zeros / trunk prefix and clamp to the country's max length. */
function normalizeNational(raw: string, country: Country): string {
  return raw.replace(/\D/g, '').replace(/^0+/, '').slice(0, country.max);
}

/** Full E.164 string, e.g. +251912345678 (max 15 digits total). */
export function toE164(country: string, national: string): string {
  const digits = national.replace(/\D/g, '');
  if (!digits) return '';
  return `${country}${digits}`.slice(0, 16);
}

export function isValidE164(value: string): boolean {
  if (!/^\+[1-9]\d{7,14}$/.test(value)) return false;
  const { country, national } = parseFullPhone(value);
  const c = COUNTRIES.find((x) => x.code === country);
  if (!c) return true;
  return national.length >= c.min && national.length <= c.max;
}

export interface PhoneInputProps {
  value: string;
  onChange: (fullPhone: string) => void;
  label?: React.ReactNode;
  optional?: boolean;
  className?: string;
  /** Notified whenever validity changes (empty + optional counts as valid). */
  onValidityChange?: (valid: boolean) => void;
}

export function PhoneInput({ value, onChange, label, optional, className, onValidityChange }: PhoneInputProps) {
  const { country, national } = parseFullPhone(value);
  const selected = COUNTRIES.find((c) => c.code === country) || COUNTRIES[0];
  const [touched, setTouched] = React.useState(false);

  const isEmpty = national.length === 0;
  const valid = isEmpty ? !!optional : isValidE164(toE164(country, national));

  React.useEffect(() => {
    onValidityChange?.(valid);
  }, [valid, onValidityChange]);

  const update = (nextCountry: string, nextNationalRaw: string) => {
    const c = COUNTRIES.find((x) => x.code === nextCountry) || COUNTRIES[0];
    const digits = normalizeNational(nextNationalRaw, c);
    onChange(digits ? toE164(nextCountry, digits) : '');
  };

  const showError = touched && !valid;
  const e164 = toE164(country, national);

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor="phone-national"
          className="text-sm text-muted-foreground font-poppins flex flex-wrap items-center gap-1"
        >
          {label}
          {optional && <span className="text-xs text-muted-foreground/60">(optional)</span>}
        </label>
      )}

      <div className="mt-1 flex flex-col gap-2 sm:flex-row">
        <div className="relative shrink-0 sm:w-40">
          <select
            value={country}
            onChange={(e) => update(e.target.value, national)}
            aria-label="Country calling code"
            className="w-full appearance-none rounded-xl border border-border bg-muted px-3 py-3 pr-8 text-base text-foreground outline-none transition-all focus:border-primary font-poppins sm:py-2.5 sm:text-sm"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            ▾
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-muted focus-within:border-primary transition-all">
            <span className="flex items-center px-3 text-sm text-muted-foreground font-poppins border-r border-border">
              {country}
            </span>
            <input
              id="phone-national"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={selected.max}
              value={national}
              onBlur={() => setTouched(true)}
              onChange={(e) => update(country, e.target.value)}
              placeholder={selected.placeholder}
              aria-invalid={showError}
              aria-describedby="phone-hint"
              className="w-full min-w-0 bg-transparent px-3 py-3 text-base text-foreground outline-none font-poppins sm:py-2.5"
            />
          </div>
        </div>
      </div>

      <p
        id="phone-hint"
        className={`mt-1 text-xs font-poppins ${showError ? 'text-destructive' : 'text-muted-foreground/70'}`}
      >
        {showError
          ? selected.min === selected.max
            ? `Enter ${selected.min} digits after ${country} (no leading 0).`
            : `Enter ${selected.min}–${selected.max} digits after ${country}.`
          : e164
            ? `Saved as ${e164}`
            : `Format: ${country}${selected.placeholder.replace(/X/g, '0')} (E.164)`}
      </p>
    </div>
  );
}

export default PhoneInput;
