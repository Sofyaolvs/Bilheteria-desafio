/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1B1B1F',
          soft: '#3A3841',
        },
        paper: {
          DEFAULT: '#FAF6EC',
          dim: '#F1EADA',
        },
        marquee: {
          DEFAULT: '#4E93C4', // azul de bilheteria — cor de assinatura do produto
          dark: '#356F9C',
          light: '#BFDCF0',
        },
        stamp: {
          DEFAULT: '#B33F2E', // carimbo/erro — inspirado em carimbo de "usado"
          dark: '#8C3123',
        },
        admit: {
          DEFAULT: '#2F6F4E', // verde selo — inspirado em carimbo de "válido"
          dark: '#234F38',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        stub: '4px 4px 0 0 rgba(27,27,31,1)',
      },
    },
  },
  plugins: [],
}
