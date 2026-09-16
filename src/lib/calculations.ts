import type { Billing, Plan } from '../data/revolut';

/** What the plan costs over its 12-month commitment. */
export const annualCost = (plan: Plan, billing: Billing): number =>
  billing === 'monthly' ? Math.round(plan.monthly * 12 * 100) / 100 : plan.yearly;

/** Yield you receive on the plan: fund yield minus Revolut's service fee, floored at zero. */
export const planApy = (plan: Plan, fundYield: number): number =>
  Math.max(0, fundYield - plan.serviceFee);

export const netReturn = (balance: number, plan: Plan, billing: Billing, fundYield: number): number =>
  Math.max(0, balance) * planApy(plan, fundYield) - annualCost(plan, billing);

export function bestPlan(balance: number, plans: Plan[], billing: Billing, fundYield: number): Plan {
  return plans.reduce((best, plan) =>
    netReturn(balance, plan, billing, fundYield) > netReturn(balance, best, billing, fundYield) + 1e-9 ? plan : best);
}

export interface Bracket {
  plan: Plan;
  from: number;
  /** null means no upper bound. */
  to: number | null;
}

/**
 * Walks the upper envelope of every plan's net-return line from €0 upwards.
 * Each step jumps to the nearest crossover with a steeper (higher-yield) plan.
 */
export function buyingGuide(plans: Plan[], billing: Billing, fundYield: number): Bracket[] {
  if (!plans.length) return [];
  let current = bestPlan(0, plans, billing, fundYield);
  let from = 0;
  const brackets: Bracket[] = [];
  for (let guard = 0; guard < plans.length; guard += 1) {
    let next: { plan: Plan; at: number } | null = null;
    for (const plan of plans) {
      const slope = planApy(plan, fundYield) - planApy(current, fundYield);
      if (slope <= 1e-12) continue;
      const at = (annualCost(plan, billing) - annualCost(current, billing)) / slope;
      if (at < from - 1e-6) continue;
      if (!next || at < next.at - 1e-6 || (Math.abs(at - next.at) <= 1e-6 && planApy(plan, fundYield) > planApy(next.plan, fundYield))) {
        next = { plan, at };
      }
    }
    if (!next) break;
    brackets.push({ plan: current, from, to: next.at });
    current = next.plan;
    from = next.at;
  }
  brackets.push({ plan: current, from, to: null });
  return brackets.filter((b) => b.to === null || b.to > b.from);
}

export const neverWorthIt = (plans: Plan[], guide: Bracket[]): Plan[] =>
  plans.filter((plan) => !guide.some((b) => b.plan.id === plan.id));
