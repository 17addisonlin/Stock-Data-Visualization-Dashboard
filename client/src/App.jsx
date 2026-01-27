import { useEffect, useMemo, useState } from 'react';
import StockChart from './components/StockChart.jsx';

const samplePoints = [
  { date: '2025-01-02', close: 186.21 },
  { date: '2025-01-03', close: 188.9 },
  { date: '2025-01-04', close: 187.45 },
  { date: '2025-01-05', close: 189.32 },
  { date: '2025-01-06', close: 190.11 },
  { date: '2025-01-07', close: 191.98 },
  { date: '2025-01-08', close: 190.42 },
  { date: '2025-01-09', close: 193.7 },
  { date: '2025-01-10', close: 194.4 },
];

const statusStyles = {
  idle: 'bg-white/70 text-slate-700',
  loading: 'bg-amber-100 text-amber-900',
  error: 'bg-rose-100 text-rose-900',
  success: 'bg-emerald-100 text-emerald-900',
};

export default function App() {
  const [symbol, setSymbol] = useState('AAPL');
  const [points, setPoints] = useState(samplePoints);
  const [latest, setLatest] = useState(samplePoints[samplePoints.length - 1]);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const changeValue = useMemo(() => {
    if (!points || points.length < 2) return null;
    const first = points[0].close;
    const last = points[points.length - 1].close;
    return {
      absolute: last - first,
      percent: (last - first) / first,
    };
  }, [points]);

  const fetchSeries = async (target) => {
    setStatus('loading');
    setMessage('Fetching Alpha Vantage data...');
    try {
      const response = await fetch(`/api/stocks/timeseries?symbol=${target}`);
      const payload = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(payload?.error || 'Unable to fetch stock data.');
        setPoints(samplePoints);
        setLatest(samplePoints[samplePoints.length - 1]);
        return;
      }

      setPoints(payload.points || []);
      setLatest(payload.latest);
      setStatus('success');
      setMessage(`Live data loaded from ${payload.source}.`);
    } catch (error) {
      setStatus('error');
      setMessage('Network error while loading stock data.');
      setPoints(samplePoints);
      setLatest(samplePoints[samplePoints.length - 1]);
    }
  };

  useEffect(() => {
    fetchSeries(symbol);
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    const cleaned = symbol.trim().toUpperCase();
    if (!cleaned) return;
    setSymbol(cleaned);
    fetchSeries(cleaned);
  };

  return (
    <div className="min-h-screen px-4 py-10 text-ink md:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="rounded-3xl bg-white/70 p-8 shadow-glow backdrop-blur">
          <p className="text-sm uppercase tracking-[0.35em] text-olive">
            Stock Pulse
          </p>
          <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-4xl font-semibold text-ink md:text-5xl">
                Calm, clear stock insights.
              </h1>
              <p className="mt-3 max-w-xl text-base text-slate-700">
                Monitor a single ticker in real time with Alpha Vantage data and a
                Plotly-powered price narrative.
              </p>
            </div>
            <form
              onSubmit={handleSubmit}
              className="flex w-full max-w-md flex-col gap-3 rounded-2xl border border-white/80 bg-white/80 p-4 shadow-lg md:flex-row"
            >
              <input
                value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
                placeholder="Ticker symbol"
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold uppercase tracking-[0.2em] text-ink outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/30"
              />
              <button
                type="submit"
                className="rounded-xl bg-ocean px-6 py-3 text-base font-semibold text-white transition hover:bg-olive"
              >
                Load
              </button>
            </form>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex min-h-[360px] flex-col rounded-3xl border border-white/70 bg-white/70 p-6 shadow-glow backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-olive">Trend</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
                  {symbol.toUpperCase()} price series
                </h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
              >
                {status}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{message}</p>
            <div className="mt-6 flex-1">
              <StockChart points={points} symbol={symbol.toUpperCase()} />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-glow backdrop-blur">
              <p className="text-xs uppercase tracking-[0.3em] text-olive">Snapshot</p>
              <h3 className="mt-2 font-display text-3xl font-semibold text-ink">
                {latest ? `$${latest.close.toFixed(2)}` : '—'}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Latest close on {latest?.date || 'N/A'}
              </p>
              {changeValue && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink/5 px-3 py-2 text-sm font-semibold text-ink">
                  <span>
                    {changeValue.absolute >= 0 ? '+' : ''}
                    {changeValue.absolute.toFixed(2)}
                  </span>
                  <span className="text-olive">
                    ({changeValue.percent >= 0 ? '+' : ''}
                    {(changeValue.percent * 100).toFixed(2)}%)
                  </span>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-glow backdrop-blur">
              <p className="text-xs uppercase tracking-[0.3em] text-olive">Next</p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-ink">
                Phase 1 checklist
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-ember"></span>
                  Connect Alpha Vantage key
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-ocean"></span>
                  Add watchlist & alerts
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-olive"></span>
                  Store favorite tickers
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
