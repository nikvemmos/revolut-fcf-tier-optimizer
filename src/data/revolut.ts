import yieldData from './yield.json';

export type Billing = 'monthly' | 'yearly';

export interface Plan {
  id: 'standard' | 'plus' | 'premium' | 'metal' | 'ultra';
  name: string;
  /** Price per month when billed monthly (EUR). Still a 12-month commitment. */
  monthly: number;
  /** Price for 12 months when billed yearly (EUR). */
  yearly: number;
  /** Revolut's annual Flexible Cash Funds service fee for EUR, taken from the fund yield. */
  serviceFee: number;
  feeUrl: string;
}

export interface YieldPoint { date: string; sevenDay: number }
export interface RatePoint { date: string; rate: number }
export interface YieldData {
  isin: string;
  shareClass: string;
  source: string;
  latest: { date: string; daily: number; sevenDay: number; thirtyDay: number };
  history: YieldPoint[];
  estr: RatePoint[];
}

export const fundYield: YieldData = yieldData;

/** Prices and fees checked on revolut.com/en-GR on 16 September 2026. */
export const pricesCheckedOn = '16 Sep 2026';

export const plans: Plan[] = [
  { id: 'standard', name: 'Standard', monthly: 0, yearly: 0, serviceFee: 0.009, feeUrl: 'https://www.revolut.com/en-GR/legal/standard-fees/' },
  { id: 'plus', name: 'Plus', monthly: 3.49, yearly: 34.99, serviceFee: 0.0075, feeUrl: 'https://www.revolut.com/en-GR/legal/plus-fees/' },
  { id: 'premium', name: 'Premium', monthly: 10.99, yearly: 110, serviceFee: 0.003, feeUrl: 'https://www.revolut.com/en-GR/legal/premium-fees/' },
  { id: 'metal', name: 'Metal', monthly: 17.99, yearly: 175, serviceFee: 0.0015, feeUrl: 'https://www.revolut.com/en-GR/legal/metal-fees/' },
  { id: 'ultra', name: 'Ultra', monthly: 60, yearly: 595, serviceFee: 0.0005, feeUrl: 'https://www.revolut.com/en-GR/legal/ultra-fees/' },
];

/** A one-off reading from the Revolut app, used to validate yield minus fee. */
export const appCheck = { date: '16 Sep 2026', plan: 'Standard', apy: 0.0153, fundYield: 0.0243 };

export const links = {
  pricing: 'https://www.revolut.com/en-GR/our-pricing-plans/',
  fidelityFile: fundYield.source,
  fidelityPage: 'https://www.fidelity.ie/liquidity-funds/',
  estr: 'https://data.ecb.europa.eu/data/datasets/EST/EST.B.EU000A2X2A25.WT',
  repo: 'https://github.com/nikvemmos/revolut-fcf-tier-optimizer',
};
