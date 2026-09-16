// Pulls the latest yield for the fund behind Revolut EUR Flexible Cash Funds
// (Fidelity ILF The Euro Fund, Class R Flex Distributing, IE000AZVL3K0) from
// Fidelity's daily LVNAV price file, plus the ECB €STR series for context.
// Appends to src/data/yield.json. Exits non-zero without writing on bad data.
import { readFile, writeFile } from 'node:fs/promises';
import ExcelJS from 'exceljs';

const ISIN = 'IE000AZVL3K0';
const FIDELITY_URL = 'https://www.fidelity.ie/media/Ireland/Excel/lvnav-eur-daily-price.xlsx';
const ESTR_URL = 'https://data-api.ecb.europa.eu/service/data/EST/B.EU000A2X2A25.WT?format=csvdata&lastNObservations=270';
const OUT = new URL('../src/data/yield.json', import.meta.url);

const pct = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < -2 || n > 15) throw new Error(`Implausible yield value: ${value}`);
  return round(n / 100);
};
const round = (x) => Math.round(x * 1e6) / 1e6;
const isoDate = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error(`Bad valuation date: ${value}`);
  return d.toISOString().slice(0, 10);
};

async function fetchFund() {
  const res = await fetch(FIDELITY_URL, { headers: { 'user-agent': 'fcf-plan-guide (github.com/nikvemmos/revolut-fcf-tier-optimizer)' } });
  if (!res.ok) throw new Error(`Fidelity file HTTP ${res.status}`);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(await res.arrayBuffer()));
  const sheet = workbook.worksheets[0];
  let header = [];
  sheet.eachRow((row) => {
    const values = row.values.map((v) => String(v ?? '').trim());
    if (!header.length && values.includes('ISIN') && values.includes('7 Day Yield')) header = values;
  });
  const col = (name) => {
    const index = header.indexOf(name);
    if (index < 1) throw new Error(`Column missing: ${name}`);
    return index;
  };
  const cols = { isin: col('ISIN'), date: col('Valuation Date'), daily: col('Daily Yield'), seven: col('7 Day Yield'), thirty: col('30 Day Yield') };
  let found = null;
  sheet.eachRow((row) => {
    if (String(row.getCell(cols.isin).value ?? '').trim() === ISIN) found = row;
  });
  if (!found) throw new Error(`${ISIN} not found in Fidelity file`);
  return {
    date: isoDate(found.getCell(cols.date).value),
    daily: pct(found.getCell(cols.daily).value),
    sevenDay: pct(found.getCell(cols.seven).value),
    thirtyDay: pct(found.getCell(cols.thirty).value),
  };
}

async function fetchEstr() {
  const res = await fetch(ESTR_URL);
  if (!res.ok) throw new Error(`ECB HTTP ${res.status}`);
  const [head, ...lines] = (await res.text()).trim().split(/\r?\n/);
  const cols = head.split(',');
  const d = cols.indexOf('TIME_PERIOD');
  const v = cols.indexOf('OBS_VALUE');
  return lines
    .map((line) => line.split(','))
    .map((c) => ({ date: c[d], rate: round(Number(c[v]) / 100) }))
    .filter((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.date) && Number.isFinite(p.rate));
}

const current = JSON.parse(await readFile(OUT, 'utf8').catch(() => '{"history":[],"estr":[]}'));
const fund = await fetchFund();

const history = (current.history ?? []).filter((p) => p.date !== fund.date);
history.push({ date: fund.date, sevenDay: fund.sevenDay });
history.sort((a, b) => a.date.localeCompare(b.date));

let estr = current.estr ?? [];
try {
  const fresh = await fetchEstr();
  if (fresh.length > 30) estr = fresh;
} catch (error) {
  console.warn(`Keeping previous €STR series: ${error.message}`);
}

const next = {
  isin: ISIN,
  shareClass: 'Fidelity ILF The Euro Fund, Class R Flex Distributing',
  source: FIDELITY_URL,
  latest: fund,
  history,
  estr,
};
// One series point per line keeps the daily commit diffs readable.
const json = JSON.stringify(next, null, 1)
  .replace(/\{\n\s+"date": ("[^"]+"),\n\s+"(\w+)": ([^\n]+)\n\s+\}/g, '{ "date": $1, "$2": $3 }');
await writeFile(OUT, json + '\n');
console.log(`Fund ${fund.date}: 7-day ${(fund.sevenDay * 100).toFixed(2)}%, €STR points ${estr.length}`);
