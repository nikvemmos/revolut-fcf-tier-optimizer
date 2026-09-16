import { describe, expect, it } from 'vitest';
import { appCheck, plans, type Plan } from '../data/revolut';
import { annualCost, bestPlan, buyingGuide, netReturn, neverWorthIt, planApy } from './calculations';

const FUND = 0.0243;
const byId = (id: Plan['id']) => plans.find((p) => p.id === id)!;

describe('plan yield', () => {
  it('matches the Standard APY observed in the app', () => {
    expect(planApy(byId('standard'), appCheck.fundYield)).toBeCloseTo(appCheck.apy, 6);
    expect(planApy(byId('ultra'), FUND)).toBeCloseTo(0.0238, 6);
  });

  it('never goes negative when the fund yields less than the fee', () => {
    expect(planApy(byId('standard'), 0.005)).toBe(0);
  });

  it('prices monthly billing as twelve payments', () => {
    expect(annualCost(byId('premium'), 'monthly')).toBeCloseTo(131.88, 2);
    expect(annualCost(byId('premium'), 'yearly')).toBe(110);
  });
});

describe('buying guide', () => {
  it('yearly billing: Standard, Premium, Metal, Ultra', () => {
    const guide = buyingGuide(plans, 'yearly', FUND);
    expect(guide.map((b) => b.plan.id)).toEqual(['standard', 'premium', 'metal', 'ultra']);
    expect(guide[0].to).toBeCloseTo(18_333.33, 1);
    expect(guide[1].to).toBeCloseTo(43_333.33, 1);
    expect(guide[2].to).toBeCloseTo(420_000, 0);
    expect(guide[3].to).toBeNull();
    expect(neverWorthIt(plans, guide).map((p) => p.id)).toEqual(['plus']);
  });

  it('monthly billing pushes every threshold up', () => {
    const guide = buyingGuide(plans, 'monthly', FUND);
    expect(guide.map((b) => b.plan.id)).toEqual(['standard', 'premium', 'metal', 'ultra']);
    expect(guide[0].to).toBeCloseTo(21_980, 0);
    expect(guide[1].to).toBeCloseTo(56_000, 0);
    expect(guide[2].to).toBeCloseTo(504_120, 0);
  });

  it('thresholds do not depend on the fund yield while it exceeds every fee', () => {
    const a = buyingGuide(plans, 'yearly', 0.0243).map((b) => b.to);
    const b = buyingGuide(plans, 'yearly', 0.035).map((b) => b.to);
    a.forEach((to, i) => (to === null ? expect(b[i]).toBeNull() : expect(b[i]).toBeCloseTo(to, 3)));
  });

  it('agrees with brute force at every bracket midpoint', () => {
    for (const billing of ['monthly', 'yearly'] as const) {
      for (const bracket of buyingGuide(plans, billing, FUND)) {
        const mid = bracket.to === null ? bracket.from * 2 + 1 : (bracket.from + bracket.to) / 2;
        expect(bestPlan(mid, plans, billing, FUND).id).toBe(bracket.plan.id);
      }
    }
  });

  it('computes net return after the plan price', () => {
    expect(netReturn(25_000, byId('premium'), 'yearly', FUND)).toBeCloseTo(422.5, 2);
    expect(netReturn(-5, byId('premium'), 'yearly', FUND)).toBe(-110);
  });
});
