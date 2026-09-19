/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ocean: {
          light: '#2a6f97',
          DEFAULT: '#014f86',
          dark: '#012a4a',
          abyss: '#00121e',
        },
        pirate: {
          gold: '#e0a92b',
          wood: '#582f0e',
          woodDark: '#331800',
          parchment: '#f4ebd9',
          crimson: '#9b2226',
        },
      },
      fontFamily: {
        pirate: ['Trebuchet MS', 'Impact', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
