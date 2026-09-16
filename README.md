# What to do with Revolut Flexible Cash Funds

**Site:** https://nikvemmos.github.io/revolut-fcf-tier-optimizer/

I keep cash in Revolut's EUR Flexible Cash Funds, where the rate you earn depends on your plan. The paid plans pay more but cost money, so I wanted to know at what balance each plan actually pays for itself, looking at yield only.

## The answer

Paying yearly, with fees as of September 2026:

| FCF balance | Best plan |
| --- | --- |
| up to €18,333 | Standard |
| €18,333 to €43,333 | Premium |
| €43,333 to €420,000 | Metal |
| €420,000 or more | Ultra |

Paying monthly pushes the switch points up to €21,980, €56,000 and €504,120. Plus is never the best choice, since at every balance another plan leaves you with more.

## How I got there

My first approach was to work out, for each paid plan, the balance where it beats Standard. Those numbers were right, but they answered the wrong question. At €25,000, Metal beats Standard, yet Premium beats Metal. What matters is which plan comes out on top when you compare all of them at once.

Each plan's net return is a straight line: `balance × rate − plan price`. The rate sets the slope and the price shifts the line down. The best plan at any balance is simply the highest line. The site finds the points where the top line changes.

## Where the rates come from

Revolut invests EUR FCF money in Fidelity ILF The Euro Fund, Class R Flex Distributing (ISIN IE000AZVL3K0). Revolut keeps a yearly fee that depends on your plan: 0.90% on Standard, 0.75% on Plus, 0.30% on Premium, 0.15% on Metal and 0.05% on Ultra. So:

```
your rate ≈ fund 7-day yield − Revolut's fee
```

On 16 September 2026 the fund's yield was 2.43%, and my app showed 1.53% on Standard. That's exactly 2.43% − 0.90%.

The fee gaps between plans are fixed, so the switch points don't move when interest rates change. Only the amount you earn does.

A GitHub Action reads Fidelity's daily price file every morning. It stores the result on the `data` branch and rebuilds the site. Plan prices and fees are taken from Revolut Greece and have to be updated by hand if they change.

## Limits

This looks at yield only. It ignores plan perks, taxes and currencies other than EUR, and it assumes your balance stays the same for a year. The rates are estimates, and the app shows the real ones. Flexible Cash Funds are investments, not deposits. Not financial advice.

## Built with

React and Vite, hosted on GitHub Pages. I did the research, the model and the checks myself, and used AI coding agents to write the code.

```bash
npm install
npm run dev
```

Nikitas Vemmos
