export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', '"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#0f172a',
        sand: '#f6f1ea',
        clay: '#d7c6b7',
        ember: '#e06f5e',
        olive: '#44624a',
        ocean: '#1b4d63',
        fog: '#fdfbf9',
      },
      boxShadow: {
        glow: '0 20px 60px -25px rgba(27, 77, 99, 0.5)',
      },
    },
  },
  plugins: [],
};
