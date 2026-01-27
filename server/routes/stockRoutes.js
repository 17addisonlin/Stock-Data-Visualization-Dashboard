const express = require('express');
const router = express.Router();

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

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

const extractSeries = (payload) => {
  const seriesKey = Object.keys(payload).find((key) =>
    key.toLowerCase().includes('time series')
  );
  if (!seriesKey) {
    return null;
  }

  return payload[seriesKey];
};

// Route to get all stocks
router.get('/', (req, res) => {
  res.json(dummyStockData);
});

// Route to fetch time series data from Alpha Vantage
router.get('/timeseries', async (req, res) => {
  const symbol = String(req.query.symbol || '').trim().toUpperCase();
  const outputsize = String(req.query.outputsize || 'compact').trim();
  const interval = String(req.query.interval || '').trim();
  const func =
    interval.length > 0 ? 'TIME_SERIES_INTRADAY' : 'TIME_SERIES_DAILY_ADJUSTED';

  if (!symbol) {
    return res.status(400).json({ error: 'Missing required query param: symbol' });
  }

  if (!API_KEY) {
    return res.status(501).json({
      error: 'Missing Alpha Vantage API key',
      hint: 'Set ALPHA_VANTAGE_API_KEY in your environment.',
    });
  }

  const params = new URLSearchParams({
    function: func,
    symbol,
    apikey: API_KEY,
    outputsize,
  });

  if (interval.length > 0) {
    params.set('interval', interval);
  }

  try {
    const response = await fetch(`${ALPHA_VANTAGE_BASE_URL}?${params.toString()}`);
    if (!response.ok) {
      return res.status(502).json({
        error: 'Alpha Vantage request failed',
        status: response.status,
      });
    }

    const payload = await response.json();

    if (payload['Error Message']) {
      return res.status(400).json({ error: payload['Error Message'] });
    }

    if (payload.Note) {
      return res.status(429).json({ error: payload.Note });
    }

    const series = extractSeries(payload);
    if (!series) {
      return res.status(502).json({ error: 'Unexpected Alpha Vantage response.' });
    }

    const points = Object.entries(series)
      .map(([date, values]) => ({
        date,
        close:
          toNumber(values['5. adjusted close']) ??
          toNumber(values['4. close']) ??
          toNumber(values['1. open']),
      }))
      .filter((point) => point.close !== null)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const latest = points.length > 0 ? points[points.length - 1] : null;

    return res.json({
      symbol,
      points,
      latest,
      source: 'Alpha Vantage',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch stock data.' });
  }
});

module.exports = router;
