/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0a0d14',
          card: '#101622',
          border: '#1f2a3d',
          green: '#00ff88',
          cyan: '#00e5ff',
          red: '#ff3366',
          amber: '#ffaa00',
          blue: '#3b82f6',
          muted: '#8b9bb4'
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
