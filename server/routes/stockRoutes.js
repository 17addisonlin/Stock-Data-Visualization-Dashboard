const express = require('express');
const router = express.Router();

const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

// Dummy stock data for testing
const dummyStockData = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 145.09,
    change: 1.23,
    percentChange: 0.85
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 2750.33,
    change: -12.67,
    percentChange: -0.46
  },
];

const toNumber = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

// Route to get all stocks
router.get('/', (req, res) => {
  res.json(dummyStockData);
});

const toDateOnly = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const getDateParam = (value, fallback) => {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed;
};

// Route to fetch time series data from Yahoo Finance
router.get('/timeseries', async (req, res) => {
  const symbol = String(req.query.symbol || '').trim().toUpperCase();
  const interval = String(req.query.interval || '1d').trim();
  const fallbackStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const period1 = getDateParam(req.query.period1, fallbackStart);
  const period2 = getDateParam(req.query.period2, new Date());

  if (!symbol) {
    return res.status(400).json({ error: 'Missing required query param: symbol' });
  }

  try {
    const result = await yahooFinance.chart(symbol, {
      period1,
      period2,
      interval,
    });

    const points = (result?.quotes || [])
      .map((quote) => ({
        date: toDateOnly(quote.date),
        open: toNumber(quote.open),
        high: toNumber(quote.high),
        low: toNumber(quote.low),
        close: toNumber(quote.close),
        volume: toNumber(quote.volume),
      }))
      .filter((point) => point.date && point.close !== null)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (points.length === 0) {
      return res.status(404).json({
        error: 'No data returned for that symbol or date range.',
      });
    }

    const latest = points[points.length - 1];

    return res.json({
      symbol,
      points,
      latest,
      source: 'Yahoo Finance',
      meta: {
        interval,
        period1: toDateOnly(period1),
        period2: toDateOnly(period2),
      },
    });
  } catch (error) {
    return res.status(502).json({
      error: 'Yahoo Finance request failed.',
      message: error?.message || 'Unknown error',
    });
  }
});

module.exports = router;
