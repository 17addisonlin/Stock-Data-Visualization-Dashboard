# Stock Data Visualization Dashboard

A full-stack starter for a stock dashboard using React, Plotly, Tailwind, and an Express API that proxies Yahoo Finance data.

## Current status
- Backend API is running with Express and a `/api/stocks/timeseries` endpoint.
- Frontend is scaffolded with React + Vite + Tailwind and a Plotly chart.
- Yahoo Finance integration is wired (no API key required).

## Tech stack
- Frontend: React (Vite), Tailwind CSS, Plotly
- Backend: Node.js, Express
- Data: Yahoo Finance

## Setup
Prerequisite: Node.js 18+ (for built-in `fetch`).

1) (Optional) Create a local env file if you want to override the server port:

```
cp .env.example .env
```

2) Install server dependencies:

```
npm install
```

3) Install client dependencies:

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

## Port note (macOS)
If you see a `403` with `Server: AirTunes` when hitting `http://localhost:5000`, macOS is already using port 5000. This project defaults to port 5050 instead.

## API endpoints
- `GET /api/stocks` - returns dummy stock list data.
- `GET /api/stocks/timeseries?symbol=AAPL` - returns Yahoo Finance time series data.

## Notes
- If Yahoo Finance does not return data for a symbol, the API responds with a 404 and the UI falls back to sample data.
- The frontend proxy is configured in `client/vite.config.js`.
