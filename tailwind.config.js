/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F0E17',
        foreground: '#FFFFFE',
        primary: '#FF00FF',
        'primary-foreground': '#FFFFFF',
        secondary: '#1A1A2E',
        'secondary-foreground': '#FFFFFE',
        muted: '#2A2A40',
        'muted-foreground': '#A0A0B0',
        accent: '#00FFFF',
        'accent-foreground': '#0F0E17',
        card: '#1A1A2E',
        'card-foreground': '#FFFFFE',
        border: '#3A3A50',
        destructive: '#FF4444',
      },
      fontFamily: {
        display: ['Orbitron'],
        body: ['Rajdhani'],
        mono: ['ShareTechMono'],
      },
    },
  },
  plugins: [],
};
