import { useEffect, useMemo, useState } from 'react';
import StockChart from './components/StockChart.jsx';

const samplePoints = [
  { date: '2025-01-02', open: 184.12, high: 187.01, low: 183.5, close: 186.21, volume: 54231000 },
  { date: '2025-01-03', open: 186.4, high: 189.22, low: 185.7, close: 188.9, volume: 49782000 },
  { date: '2025-01-04', open: 188.6, high: 189.1, low: 186.3, close: 187.45, volume: 46290000 },
  { date: '2025-01-05', open: 187.2, high: 190.02, low: 186.9, close: 189.32, volume: 51033000 },
  { date: '2025-01-06', open: 189.4, high: 191.12, low: 188.8, close: 190.11, volume: 48812000 },
  { date: '2025-01-07', open: 190.5, high: 192.7, low: 189.9, close: 191.98, volume: 51588000 },
  { date: '2025-01-08', open: 191.2, high: 192.05, low: 189.7, close: 190.42, volume: 47654000 },
  { date: '2025-01-09', open: 190.1, high: 194.0, low: 189.8, close: 193.7, volume: 55992000 },
  { date: '2025-01-10', open: 193.5, high: 195.1, low: 192.4, close: 194.4, volume: 52347000 },
];

const rangeOptions = [
  { label: '1D', value: '1D', days: 1 },
  { label: '5D', value: '5D', days: 5 },
  { label: '1M', value: '1M', days: 30 },
  { label: '3M', value: '3M', days: 90 },
  { label: '6M', value: '6M', days: 180 },
  { label: '1Y', value: '1Y', days: 365 },
  { label: '5Y', value: '5Y', days: 1825 },
];

const intervalOptions = [
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '1d', value: '1d' },
  { label: '1wk', value: '1wk' },
  { label: '1mo', value: '1mo' },
];

const statusStyles = {
  idle: 'bg-panel2 text-muted',
  loading: 'bg-highlight/20 text-highlight',
  error: 'bg-rose/20 text-rose',
  success: 'bg-mint/20 text-mint',
};

const WATCHLIST_KEY = 'stockPulse.watchlist';
const ALERTS_KEY = 'stockPulse.alerts';

const loadFromStorage = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const saveToStorage = (key, value) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const isIntradayInterval = (value) => value.endsWith('m') || value.endsWith('h');

const getRangeDays = (value) =>
  rangeOptions.find((option) => option.value === value)?.days ?? 30;

const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
};

const formatCompact = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
};

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const updateAlerts = (currentAlerts, latest, symbol) => {
  if (!latest || !symbol) return currentAlerts;
  const now = new Date().toISOString();
  return currentAlerts.map((alert) => {
    if (alert.symbol !== symbol) return alert;
    const hit =
      alert.condition === 'above'
        ? latest.close >= alert.target
        : latest.close <= alert.target;

    if (!hit && alert.triggered) {
      return { ...alert, lastChecked: now, lastPrice: latest.close };
    }

    if (!hit) {
      return { ...alert, lastChecked: now, lastPrice: latest.close };
    }

    if (alert.triggered) {
      return { ...alert, lastChecked: now, lastPrice: latest.close };
    }

    return {
      ...alert,
      triggered: true,
      triggeredAt: now,
      lastChecked: now,
      lastPrice: latest.close,
    };
  });
};

export default function App() {
  const [symbol, setSymbol] = useState('TSLA');
  const [symbolInput, setSymbolInput] = useState('TSLA');
  const [points, setPoints] = useState(samplePoints);
  const [latest, setLatest] = useState(samplePoints[samplePoints.length - 1]);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [chartType, setChartType] = useState('line');
  const [showVolume, setShowVolume] = useState(true);
  const [range, setRange] = useState('3M');
  const [interval, setInterval] = useState('1d');
  const [meta, setMeta] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [watchlistInput, setWatchlistInput] = useState('');
  const [watchlist, setWatchlist] = useState(() =>
    loadFromStorage(WATCHLIST_KEY, ['TSLA', 'NVDA', 'AAPL', 'MSFT'])
  );
  const [alerts, setAlerts] = useState(() => loadFromStorage(ALERTS_KEY, []));
  const [alertForm, setAlertForm] = useState({
    symbol: 'TSLA',
    condition: 'above',
    target: '',
  });

  const changeValue = useMemo(() => {
    if (!points || points.length < 2) return null;
    const first = points[0].close;
    const last = points[points.length - 1].close;
    if (first === null || last === null) return null;
    return {
      absolute: last - first,
      percent: (last - first) / first,
    };
  }, [points]);

  const candleAvailable = useMemo(
    () => points.some((point) => point.open !== null && point.high !== null),
    [points]
  );
  const volumeAvailable = useMemo(
    () => points.some((point) => point.volume !== null),
    [points]
  );

  const fetchSeries = async (targetSymbol, nextRange, nextInterval) => {
    if (!targetSymbol) return;
    const activeRange = nextRange ?? range;
    const activeInterval = nextInterval ?? interval;
    const rangeDays = getRangeDays(activeRange);
    const now = new Date();
    const clampedDays =
      isIntradayInterval(activeInterval) && rangeDays > 30 ? 30 : rangeDays;
    const start = new Date(now.getTime() - clampedDays * 24 * 60 * 60 * 1000);

    const params = new URLSearchParams({
      symbol: targetSymbol,
      interval: activeInterval,
      period1: start.toISOString(),
      period2: now.toISOString(),
    });

    setStatus('loading');
    setMessage(
      clampedDays !== rangeDays
        ? 'Range shortened for intraday interval. Fetching data...'
        : 'Fetching Yahoo Finance data...'
    );

    try {
      const response = await fetch(`/api/stocks/timeseries?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(payload?.error || 'Unable to fetch stock data.');
        setPoints(samplePoints);
        setLatest(samplePoints[samplePoints.length - 1]);
        setMeta(null);
        return;
      }

      setPoints(payload.points || []);
      setLatest(payload.latest);
      setMeta(payload.meta || null);
      setStatus('success');
      setMessage(`Live data loaded from ${payload.source}.`);
      setLastUpdated(new Date().toISOString());
      setAlerts((prev) => updateAlerts(prev, payload.latest, payload.symbol));
    } catch (error) {
      setStatus('error');
      setMessage('Network error while loading stock data.');
      setPoints(samplePoints);
      setLatest(samplePoints[samplePoints.length - 1]);
      setMeta(null);
    }
  };

  useEffect(() => {
    fetchSeries(symbol);
  }, [symbol, range, interval]);

  useEffect(() => {
    saveToStorage(WATCHLIST_KEY, watchlist);
  }, [watchlist]);

  useEffect(() => {
    saveToStorage(ALERTS_KEY, alerts);
  }, [alerts]);

  useEffect(() => {
    setAlertForm((prev) => ({ ...prev, symbol }));
  }, [symbol]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const cleaned = symbolInput.trim().toUpperCase();
    if (!cleaned) return;
    setSymbol(cleaned);
    setSymbolInput(cleaned);
  };

  const addToWatchlist = (value) => {
    const cleaned = value.trim().toUpperCase();
    if (!cleaned) return;
    setWatchlist((prev) => (prev.includes(cleaned) ? prev : [...prev, cleaned]));
  };

  const removeFromWatchlist = (value) => {
    setWatchlist((prev) => prev.filter((item) => item !== value));
  };

  const handleAddAlert = (event) => {
    event.preventDefault();
    const cleaned = alertForm.symbol.trim().toUpperCase();
    const target = Number.parseFloat(alertForm.target);
    if (!cleaned || !Number.isFinite(target)) return;
    const nextAlert = {
      id: createId(),
      symbol: cleaned,
      condition: alertForm.condition,
      target,
      createdAt: new Date().toISOString(),
      triggered: false,
      triggeredAt: null,
      lastChecked: null,
      lastPrice: null,
    };
    setAlerts((prev) => [nextAlert, ...prev]);
    setAlertForm((prev) => ({ ...prev, target: '' }));
  };

  const dismissAlert = (id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const resetAlert = (id) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id
          ? { ...alert, triggered: false, triggeredAt: null }
          : alert
      )
    );
  };

  const rangeLabel = rangeOptions.find((option) => option.value === range)?.label;

  return (
    <div className="min-h-screen bg-night text-slate-100">
      <div className="sticky top-0 z-10 border-b border-stroke bg-night/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-highlight/20 text-highlight">
              <span className="font-display text-lg">S</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-muted">Stock Pulse</p>
              <p className="text-sm font-semibold text-slate-100">Live Dashboard</p>
            </div>
          </div>
          <form
            onSubmit={handleSubmit}
            className="flex w-full max-w-md items-center gap-3 rounded-full border border-stroke bg-panel2 px-4 py-2"
          >
            <span className="text-muted">⌕</span>
            <input
              value={symbolInput}
              onChange={(event) => setSymbolInput(event.target.value)}
              placeholder="Search companies, ETFs, and markets"
              className="w-full bg-transparent text-sm text-slate-100 outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-highlight px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-night"
            >
              Go
            </button>
          </form>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className={`rounded-full px-3 py-1 ${statusStyles[status]}`}>
              {status}
            </span>
            {lastUpdated && (
              <span className="rounded-full border border-stroke bg-panel2 px-3 py-1">
                Updated {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <header className="rounded-3xl border border-stroke bg-panel p-6 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-muted">Overview</p>
              <div className="mt-3 flex items-center gap-3">
                <h1 className="font-display text-4xl font-semibold text-slate-100">
                  {symbol}
                </h1>
                <span className="rounded-full border border-stroke bg-panel2 px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted">
                  {rangeLabel || 'Range'}
                </span>
              </div>
              <p className="mt-3 max-w-xl text-sm text-muted">
                Monitor live price action, manage alerts, and keep an eye on your
                watchlist in one place.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {meta && (
                <span className="rounded-full border border-stroke bg-panel2 px-3 py-1 text-xs text-muted">
                  {meta.period1} → {meta.period2}
                </span>
              )}
              <span className="rounded-full border border-stroke bg-panel2 px-3 py-1 text-xs text-muted">
                Interval {interval}
              </span>
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-6 xl:grid-cols-[2.2fr_1fr]">
          <div className="rounded-3xl border border-stroke bg-panel p-6 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-muted">Price</p>
                <div className="mt-2 flex items-center gap-3">
                  <h2 className="font-display text-3xl text-slate-100">
                    {latest ? formatCurrency(latest.close) : '—'}
                  </h2>
                  {changeValue && (
                    <span className="rounded-full bg-mint/15 px-3 py-1 text-xs font-semibold text-mint">
                      {changeValue.absolute >= 0 ? '+' : ''}
                      {changeValue.absolute.toFixed(2)} ({changeValue.percent >= 0 ? '+' : ''}
                      {(changeValue.percent * 100).toFixed(2)}%)
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-muted">
                {rangeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRange(option.value)}
                    className={`rounded-full border border-stroke px-3 py-1 transition ${
                      range === option.value
                        ? 'bg-highlight text-night'
                        : 'bg-panel2 hover:bg-panel'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted">
              <div className="flex items-center gap-2">
                <span>Interval</span>
                <select
                  value={interval}
                  onChange={(event) => setInterval(event.target.value)}
                  className="rounded-full border border-stroke bg-panel2 px-3 py-1 text-xs text-slate-100"
                >
                  {intervalOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span>View</span>
                <button
                  type="button"
                  onClick={() => setChartType('line')}
                  className={`rounded-full border border-stroke px-3 py-1 ${
                    chartType === 'line' ? 'bg-panel2 text-slate-100' : 'text-muted'
                  }`}
                >
                  Line
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('candlestick')}
                  className={`rounded-full border border-stroke px-3 py-1 ${
                    chartType === 'candlestick'
                      ? 'bg-panel2 text-slate-100'
                      : 'text-muted'
                  }`}
                >
                  Candle
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span>Volume</span>
                <button
                  type="button"
                  onClick={() => setShowVolume((prev) => !prev)}
                  className={`rounded-full border border-stroke px-3 py-1 ${
                    showVolume ? 'bg-panel2 text-slate-100' : 'text-muted'
                  }`}
                >
                  {showVolume ? 'On' : 'Off'}
                </button>
              </div>
            </div>

            <div className="mt-6 h-[380px]">
              <StockChart
                points={points}
                symbol={symbol.toUpperCase()}
                chartType={chartType}
                showVolume={showVolume}
              />
            </div>

            {message && <p className="mt-4 text-xs text-muted">{message}</p>}
            {!candleAvailable && chartType === 'candlestick' && (
              <p className="mt-2 text-xs text-amber-300">
                Candlestick requires OHLC data. Showing a line chart instead.
              </p>
            )}
            {showVolume && !volumeAvailable && (
              <p className="mt-2 text-xs text-amber-300">
                Volume data not available for this symbol.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-stroke bg-panel p-6 shadow-soft">
              <p className="text-xs uppercase tracking-[0.4em] text-muted">Snapshot</p>
              <div className="mt-4 grid gap-4 text-sm">
                {[
                  { label: 'Open', value: formatCurrency(latest?.open) },
                  { label: 'High', value: formatCurrency(latest?.high) },
                  { label: 'Low', value: formatCurrency(latest?.low) },
                  { label: 'Volume', value: formatCompact(latest?.volume) },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-2xl border border-stroke bg-panel2 px-4 py-3"
                  >
                    <span className="text-xs uppercase tracking-[0.3em] text-muted">
                      {item.label}
                    </span>
                    <span className="text-sm font-semibold text-slate-100">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-stroke bg-panel p-6 shadow-soft">
              <p className="text-xs uppercase tracking-[0.4em] text-muted">Watchlist</p>
              <div className="mt-4 flex items-center gap-2">
                <input
                  value={watchlistInput}
                  onChange={(event) => setWatchlistInput(event.target.value)}
                  placeholder="Add symbol"
                  className="flex-1 rounded-2xl border border-stroke bg-panel2 px-3 py-2 text-sm uppercase tracking-[0.2em] text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => {
                    addToWatchlist(watchlistInput);
                    setWatchlistInput('');
                  }}
                  className="rounded-2xl bg-highlight px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-night"
                >
                  Add
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {watchlist.length === 0 && (
                  <p className="text-sm text-muted">No watchlist tickers yet.</p>
                )}
                {watchlist.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-full border border-stroke bg-panel2 px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-100"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSymbol(item);
                        setSymbolInput(item);
                      }}
                    >
                      {item}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromWatchlist(item)}
                      className="text-rose"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-stroke bg-panel p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.4em] text-muted">Alerts</p>
            <span className="rounded-full border border-stroke bg-panel2 px-3 py-1 text-xs text-muted">
              {alerts.length} active
            </span>
          </div>
          <form onSubmit={handleAddAlert} className="mt-4 grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                value={alertForm.symbol}
                onChange={(event) =>
                  setAlertForm((prev) => ({
                    ...prev,
                    symbol: event.target.value,
                  }))
                }
                placeholder="Symbol"
                className="rounded-2xl border border-stroke bg-panel2 px-3 py-2 text-sm uppercase tracking-[0.2em] text-slate-100"
              />
              <select
                value={alertForm.condition}
                onChange={(event) =>
                  setAlertForm((prev) => ({
                    ...prev,
                    condition: event.target.value,
                  }))
                }
                className="rounded-2xl border border-stroke bg-panel2 px-3 py-2 text-sm text-slate-100"
              >
                <option value="above">Above</option>
                <option value="below">Below</option>
              </select>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <input
                value={alertForm.target}
                onChange={(event) =>
                  setAlertForm((prev) => ({
                    ...prev,
                    target: event.target.value,
                  }))
                }
                placeholder="Target price"
                className="rounded-2xl border border-stroke bg-panel2 px-3 py-2 text-sm text-slate-100"
              />
              <button
                type="submit"
                className="rounded-2xl bg-mint px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-night"
              >
                Set
              </button>
            </div>
          </form>
          <div className="mt-4 space-y-3">
            {alerts.length === 0 && (
              <p className="text-sm text-muted">No alerts configured yet.</p>
            )}
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex flex-col gap-2 rounded-2xl border border-stroke bg-panel2 p-3 text-xs text-muted"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-100">
                    {alert.symbol} {alert.condition} {formatCurrency(alert.target)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                      alert.triggered ? 'bg-rose/20 text-rose' : 'bg-mint/20 text-mint'
                    }`}
                  >
                    {alert.triggered ? 'Triggered' : 'Watching'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span>Last price: {formatCurrency(alert.lastPrice)}</span>
                  {alert.lastChecked && (
                    <span>
                      Checked {new Date(alert.lastChecked).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => resetAlert(alert.id)}
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-mint"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissAlert(alert.id)}
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-rose"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
