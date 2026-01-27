import Plot from 'react-plotly.js';

const baseLayout = {
  autosize: true,
  margin: { l: 56, r: 24, t: 32, b: 48 },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  xaxis: {
    showgrid: false,
    tickfont: { color: '#8b939f' },
    rangeslider: { visible: false },
  },
  yaxis: {
    gridcolor: 'rgba(31, 36, 43, 0.9)',
    tickfont: { color: '#8b939f' },
  },
  font: {
    family: 'Manrope, system-ui, sans-serif',
    color: '#e2e8f0',
  },
  hovermode: 'x unified',
};

const hasOhlc = (points) =>
  points.some(
    (point) =>
      point.open !== null &&
      point.high !== null &&
      point.low !== null &&
      point.close !== null
  );

export default function StockChart({ points, symbol, chartType, showVolume }) {
  if (!points || points.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-2xl border border-stroke bg-panel2 p-8 text-sm text-muted">
        No chart data available yet.
      </div>
    );
  }

  const dates = points.map((point) => point.date);
  const closes = points.map((point) => point.close);
  const opens = points.map((point) => point.open);
  const highs = points.map((point) => point.high);
  const lows = points.map((point) => point.low);
  const volumes = points.map((point) => point.volume);

  const showCandle = chartType === 'candlestick' && hasOhlc(points);
  const showBars = showVolume && points.some((point) => point.volume !== null);

  const layout = {
    ...baseLayout,
    yaxis: {
      ...baseLayout.yaxis,
      domain: showBars ? [0.28, 1] : [0, 1],
    },
  };

  if (showBars) {
    layout.yaxis2 = {
      domain: [0, 0.2],
      showgrid: false,
      tickfont: { color: '#8b939f' },
    };
  }

  const traces = [];

  if (showCandle) {
    traces.push({
      type: 'candlestick',
      x: dates,
      open: opens,
      high: highs,
      low: lows,
      close: closes,
      increasing: { line: { color: '#34d399', width: 2 } },
      decreasing: { line: { color: '#fb7185', width: 2 } },
      hovertemplate:
        '%{x}<br>Open: $%{open:.2f}<br>High: $%{high:.2f}<br>Low: $%{low:.2f}<br>Close: $%{close:.2f}<extra></extra>',
      name: symbol,
    });
  } else {
    traces.push({
      x: dates,
      y: closes,
      type: 'scatter',
      mode: 'lines',
      line: { color: '#34d399', width: 3 },
      fill: 'tozeroy',
      fillcolor: 'rgba(52, 211, 153, 0.12)',
      hovertemplate: '%{x}<br>$%{y:.2f}<extra></extra>',
      name: symbol,
    });
  }

  if (showBars) {
    traces.push({
      x: dates,
      y: volumes,
      type: 'bar',
      yaxis: 'y2',
      marker: { color: 'rgba(56, 189, 248, 0.4)' },
      hovertemplate: '%{x}<br>Volume: %{y:.3s}<extra></extra>',
      name: 'Volume',
    });
  }

  return (
    <div className="h-full w-full">
      <Plot
        data={traces}
        layout={{
          ...layout,
          title: {
            text: `${symbol} price trend`,
            font: { family: 'Space Grotesk, system-ui, sans-serif', size: 18 },
          },
          showlegend: false,
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler
      />
    </div>
  );
}
