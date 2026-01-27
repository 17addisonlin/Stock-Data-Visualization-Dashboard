export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Manrope"', 'system-ui', 'sans-serif'],
      },
      colors: {
        night: '#0b0d10',
        panel: '#111418',
        panel2: '#141a20',
        stroke: '#1f242b',
        muted: '#8b939f',
        highlight: '#f5b942',
        mint: '#34d399',
        ember: '#f97316',
        rose: '#fb7185',
        sky: '#38bdf8',
      },
      boxShadow: {
        glow: '0 25px 60px -40px rgba(53, 83, 124, 0.6)',
        soft: '0 20px 50px -35px rgba(15, 23, 42, 0.8)',
      },
    },
  },
  plugins: [],
};
