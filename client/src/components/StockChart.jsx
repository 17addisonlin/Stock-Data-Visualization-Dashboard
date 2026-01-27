import Plot from 'react-plotly.js';

const chartLayout = {
  autosize: true,
  margin: { l: 48, r: 24, t: 24, b: 48 },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  xaxis: {
    showgrid: false,
    tickfont: { color: '#37515f' },
  },
  yaxis: {
    gridcolor: 'rgba(27, 77, 99, 0.12)',
    tickfont: { color: '#37515f' },
  },
  font: {
    family: 'IBM Plex Sans, system-ui, sans-serif',
    color: '#0f172a',
  },
};

export default function StockChart({ points, symbol }) {
  if (!points || points.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-3xl border border-white/70 bg-white/60 p-8 text-slate-600">
        No chart data available yet.
      </div>
    );
  }

  const dates = points.map((point) => point.date);
  const prices = points.map((point) => point.close);

  return (
    <div className="h-full w-full">
      <Plot
        data={[
          {
            x: dates,
            y: prices,
            type: 'scatter',
            mode: 'lines',
            line: { color: '#1b4d63', width: 3 },
            fill: 'tozeroy',
            fillcolor: 'rgba(27, 77, 99, 0.15)',
            hovertemplate: '%{x}<br>$%{y:.2f}<extra></extra>',
            name: symbol,
          },
        ]}
        layout={{
          ...chartLayout,
          title: {
            text: `${symbol} price trend`,
            font: { family: 'Space Grotesk, system-ui, sans-serif', size: 18 },
          },
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler
      />
    </div>
  );
}
