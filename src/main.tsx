import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/source-serif-4';
import '@fontsource-variable/source-serif-4/wght-italic.css';
import '@fontsource/caveat/600.css';
import { appCheck, fundYield, links, plans, pricesCheckedOn, type Billing } from './data/revolut';
import { annualCost, bestPlan, buyingGuide, netReturn, neverWorthIt, planApy } from './lib/calculations';
import './styles.css';

const eur0 = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const eur2 = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (v: number) => eur0.format(Math.round(v));
const money2 = (v: number) => eur2.format(v);
const pct = (v: number) => (v * 100).toFixed(2) + '%';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const date = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

const FUND = fundYield.latest.sevenDay;
const standard = plans[0];
const EXAMPLES = [5_000, 20_000, 50_000, 100_000, 500_000];

function YieldChart() {
  const estr = fundYield.estr;
  const fund = fundYield.history;
  if (estr.length < 2) return null;
  const W = 600, H = 220, pad = { l: 44, r: 10, t: 12, b: 26 };
  const t0 = Date.parse(estr[0].date);
  const t1 = Math.max(Date.parse(estr[estr.length - 1].date), Date.parse(fund[fund.length - 1]?.date ?? estr[0].date));
  const values = [...estr.map((p) => p.rate), ...fund.map((p) => p.sevenDay)];
  const lo = Math.floor(Math.min(...values) * 400) / 400;
  const hi = Math.ceil(Math.max(...values) * 400) / 400;
  const x = (d: string) => pad.l + ((Date.parse(d) - t0) / Math.max(1, t1 - t0)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + ((hi - v) / Math.max(1e-6, hi - lo)) * (H - pad.t - pad.b);
  const ticks = Array.from({ length: Math.round((hi - lo) / 0.0025) + 1 }, (_, i) => lo + i * 0.0025);
  const path = (pts: [string, number][]) => pts.map(([d, v], i) => `${i ? 'L' : 'M'}${x(d).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const months = estr.filter((p, i) => i === 0 || p.date.slice(5, 7) !== estr[i - 1].date.slice(5, 7)).filter((_, i) => i % 3 === 0);
  const last = fund[fund.length - 1];
  return (
    <figure className="fig">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Line chart: €STR over the last year, now ${pct(estr[estr.length - 1].rate)}. Fund 7-day yield now ${pct(FUND)}.`}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="fig-grid" x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} />
            <text className="fig-tick" x={pad.l - 6} y={y(t) + 4} textAnchor="end">{(t * 100).toFixed(2)}%</text>
          </g>
        ))}
        {months.map((m) => (
          <text key={m.date} className="fig-tick" x={x(m.date)} y={H - 6}>{MONTHS[Number(m.date.slice(5, 7)) - 1]} {m.date.slice(2, 4)}</text>
        ))}
        <path className="fig-estr" d={path(estr.map((p) => [p.date, p.rate]))} />
        {fund.length > 1 && <path className="fig-fund" d={path(fund.map((p) => [p.date, p.sevenDay]))} />}
        {last && <circle className="fig-dot" cx={x(last.date)} cy={y(last.sevenDay)} r={4} />}
      </svg>
      <figcaption>
        <b>Fig. 1</b> The fund's 7-day yield (black, logged since {date(fund[0].date)}) against €STR, the ECB overnight rate (grey).
        The fund tends to sit a little above €STR.
      </figcaption>
    </figure>
  );
}

function App() {
  const [billing, setBilling] = useState<Billing>('yearly');
  const guide = useMemo(() => buyingGuide(plans, billing, FUND), [billing]);
  const skip = neverWorthIt(plans, guide);
  const yearlyFirst = useMemo(() => buyingGuide(plans, 'yearly', FUND).find((b) => b.plan.id !== 'standard'), []);
  const monthlyFirst = useMemo(() => buyingGuide(plans, 'monthly', FUND).find((b) => b.plan.id === yearlyFirst?.plan.id), [yearlyFirst]);

  return (
    <main className="page">
      <header>
        <p className="kicker">By Nikitas Vemmos · Rates last updated <b>{date(fundYield.latest.date)}</b></p>
        <h1>What should I do with my Revolut Flexible Cash Funds?</h1>
        <p className="intro">
          Revolut pays more on your cash the more expensive your plan is. But the plans cost money.
          So at what balance does upgrading actually pay for itself? I did the maths so you don't have to.
        </p>
        <aside className="nfa" role="note">
          <strong>Not financial advice.</strong> This is a personal project, not a recommendation.
          The rates below are approximations worked out from the fund's published yield and Revolut's fees, so always check
          the actual rate in the Revolut app. Flexible Cash Funds are investments, not bank deposits, and your capital is at risk.
        </aside>
      </header>

      <section>
        <h2><span className="num">1.</span> The short answer</h2>
        <fieldset className="billing">
          <legend>I'd pay for the plan</legend>
          <label><input type="radio" name="billing" checked={billing === 'yearly'} onChange={() => setBilling('yearly')} /> yearly</label>
          <label><input type="radio" name="billing" checked={billing === 'monthly'} onChange={() => setBilling('monthly')} /> monthly</label>
        </fieldset>

        <div className="answer-wrap">
          <div className="answer-scroll">
            <table className="answer">
              <thead>
                <tr><th scope="col">If you have this much in FCF</th><th scope="col">Get</th><th scope="col">Costs</th><th scope="col">You keep per year</th></tr>
              </thead>
              <tbody>
                {guide.map((b) => {
                  const low = b.from === 0 ? null : netReturn(b.from, b.plan, billing, FUND);
                  const high = b.to === null ? null : netReturn(b.to, b.plan, billing, FUND);
                  return (
                    <tr key={b.plan.id}>
                      <td className="range">
                        {b.from === 0 ? <>up to {money(b.to!)}</> : b.to === null ? <>{money(b.from)} or more</> : <>{money(b.from)} to {money(b.to)}</>}
                      </td>
                      <td><mark>{b.plan.name}</mark></td>
                      <td className="n">{b.plan.yearly === 0 ? 'free' : billing === 'yearly' ? `${money2(b.plan.yearly)}/yr` : `${money2(b.plan.monthly)}/mo`}</td>
                      <td className="n">
                        {low === null ? `up to ${money(high!)}` : high === null ? `${money(low)} and up` : `${money(low)} to ${money(high)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {skip.length > 0 && <p className="scribble" aria-hidden="true">skip {skip.map((p) => p.name).join(' & ')}!</p>}
        </div>

        <p>
          {skip.length > 0 && <><b>{skip.map((p) => p.name).join(' and ')}</b> never makes the list: at every balance some other plan leaves you with more. </>}
          "You keep" means the interest after Revolut's fee, minus the plan price, over one year at today's rate.
        </p>
      </section>

      <section>
        <h2><span className="num">2.</span> Where the numbers come from</h2>
        <p>
          Your FCF money goes into a Fidelity money market fund<sup><a href="#fn1">1</a></sup>. Fidelity publishes that fund's yield every
          working day. Revolut then takes a yearly fee out of it, and that fee is lower on the pricier plans<sup><a href="#fn2">2</a></sup>. So:
        </p>
        <p className="formula">your rate = fund yield − Revolut's fee</p>
        <table className="rates">
          <caption>Latest fund yield: <b>{pct(FUND)}</b> on {date(fundYield.latest.date)}</caption>
          <thead><tr><th scope="col">Plan</th><th scope="col">Fee</th><th scope="col">Your rate</th></tr></thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id}><th scope="row">{p.name}</th><td className="n">{pct(p.serviceFee)}</td><td className="n">{pct(planApy(p, FUND))}</td></tr>
            ))}
          </tbody>
        </table>
        <p>
          These are estimates. Revolut shows the rate you actually get in the app. As a check: on {appCheck.date} my app
          showed {pct(appCheck.apy)} on {appCheck.plan}, and the fund was at {pct(appCheck.fundYield)} that day, so {pct(appCheck.fundYield)} − {pct(standard.serviceFee)} matched exactly.
        </p>
        <p>
          The fun part: the fee gaps between plans never change, so <mark>the rate going up or down doesn't change which plan to pick</mark>.
          It only changes how much you make. (That holds as long as the fund pays more than {pct(standard.serviceFee)}.)
        </p>
        <YieldChart />
      </section>

      <section>
        <h2><span className="num">3.</span> A few examples</h2>
        <ul className="examples">
          {EXAMPLES.map((balance) => {
            const plan = bestPlan(balance, plans, billing, FUND);
            const net = netReturn(balance, plan, billing, FUND);
            const extra = net - netReturn(balance, standard, billing, FUND);
            return (
              <li key={balance}>
                <b>{money(balance)}</b>: get {plan.name}, keep about {money(net)} a year
                {extra > 0.5 ? <>, which is {money(extra)} more than staying on Standard.</> : <>. Upgrading wouldn't pay off yet.</>}
              </li>
            );
          })}
        </ul>
        <p className="small">(Paying {billing}. You can switch that in section 1.)</p>
      </section>

      <section>
        <h2><span className="num">4.</span> Monthly or yearly?</h2>
        <p>
          Both lock you in for 12 months, so if you're upgrading anyway, pay yearly. Monthly costs more, which pushes every threshold up
          {monthlyFirst && yearlyFirst && <> ({yearlyFirst.plan.name} only starts paying off at {money(monthlyFirst.from)} instead of {money(yearlyFirst.from)})</>}.
        </p>
        <table className="rates">
          <thead><tr><th scope="col">Plan</th><th scope="col">12 × monthly</th><th scope="col">Yearly</th><th scope="col">Extra</th></tr></thead>
          <tbody>
            {plans.filter((p) => p.yearly > 0).map((p) => (
              <tr key={p.id}>
                <th scope="row">{p.name}</th>
                <td className="n">{money2(annualCost(p, 'monthly'))}</td>
                <td className="n">{money2(p.yearly)}</td>
                <td className="n">+{money2(annualCost(p, 'monthly') - p.yearly)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2><span className="num">5.</span> What this ignores</h2>
        <p>
          Only the interest counts here. Cards, insurance, lounges, RevPoints and the other perks are left out, and so are taxes.
          It's EUR only, rates move every day, and prices can change. If you'd buy Metal for the travel insurance anyway, the maths is different.
        </p>
      </section>

      <footer className="notes">
        <ol>
          <li id="fn1">
            Fidelity ILF The Euro Fund, Class R Flex Distributing (ISIN {fundYield.isin}). Yield from Fidelity's{' '}
            <a href={links.fidelityFile}>daily price file</a>, pulled automatically every weekday. €STR from the <a href={links.estr}>ECB</a>.
          </li>
          <li id="fn2">
            Fees and plan prices from <a href={links.pricing}>Revolut Greece</a>, checked {pricesCheckedOn}.
          </li>
        </ol>
        <p>
          Made by Nikitas Vemmos. Rates refresh automatically every day. Not affiliated with Revolut or Fidelity. <b>Not financial advice.</b>{' '}
          <a href={links.repo}>Code on GitHub</a>.
        </p>
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
