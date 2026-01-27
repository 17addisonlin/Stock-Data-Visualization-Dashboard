# Stock Data Visualization Dashboard

A full-stack starter for a stock dashboard using React, Plotly, Tailwind, and an Express API that proxies Alpha Vantage data.

## Current status
- Backend API is running with Express and a `/api/stocks/timeseries` endpoint.
- Frontend is scaffolded with React + Vite + Tailwind and a Plotly chart.
- Alpha Vantage integration is wired but requires an API key.

## Tech stack
- Frontend: React (Vite), Tailwind CSS, Plotly
- Backend: Node.js, Express
- Data: Alpha Vantage

## Setup
Prerequisite: Node.js 18+ (for built-in `fetch`).

1) Create an Alpha Vantage API key.
2) Create a local env file:

```
cp .env.example .env
```

3) Install server dependencies:

```
npm install
```

4) Install client dependencies:

```
cd client
npm install
```

## Run locally
Terminal 1 (server):

```
npm start
```

Terminal 2 (client):

```
cd client
npm run dev
```

Then open the Vite dev URL printed in the terminal (usually http://localhost:5173).

## API endpoints
- `GET /api/stocks` - returns dummy stock list data.
- `GET /api/stocks/timeseries?symbol=AAPL` - returns Alpha Vantage time series data.

## Notes
- If you hit Alpha Vantage rate limits, the API returns `429` and the UI falls back to sample data.
- The frontend proxy is configured in `client/vite.config.js`.
