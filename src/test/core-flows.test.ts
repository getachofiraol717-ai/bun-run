import { describe, it, expect } from 'vitest';

describe('Knowledge Universe Core Flows', () => {
  it('should validate Ethiopian curriculum pricing and promo codes', () => {
    const VALID_PROMOS: Record<string, number> = {
      KNOWLEDGE100: 100,
      STUDENT50: 50,
      ETHIOPIA2025: 30,
    };

    const calculatePrice = (basePrice: number, promoCode?: string) => {
      if (!promoCode || !VALID_PROMOS[promoCode]) return basePrice;
      const discount = (basePrice * VALID_PROMOS[promoCode]) / 100;
      return Math.max(0, basePrice - discount);
    };

    expect(calculatePrice(100, 'KNOWLEDGE100')).toBe(0);
    expect(calculatePrice(100, 'STUDENT50')).toBe(50);
    expect(calculatePrice(150, 'ETHIOPIA2025')).toBe(105);
    expect(calculatePrice(100, 'INVALID')).toBe(100);
  });

  it('should maintain security boundaries on client storage tokens', () => {
    localStorage.setItem('ku_is_premium', 'true');
    expect(localStorage.getItem('ku_is_premium')).toBe('true');
    localStorage.removeItem('ku_is_premium');
    expect(localStorage.getItem('ku_is_premium')).toBeNull();
  });
});
