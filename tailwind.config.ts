import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2D6A4F',
        'primary-light': '#52B788',
        'primary-faded': '#D8F3DC',
        accent: '#E76F51',
        'accent-light': '#F4A261',
        background: '#F6F1EB',
        card: '#FFFFFF',
        text: '#1B1B1B',
        'text-mid': '#555555',
        'text-light': '#8B8B8B',
        border: '#E8E0D8',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      maxWidth: {
        app: '480px',
      },
      boxShadow: {
        soft: '0 12px 32px rgba(45, 106, 79, 0.08)',
      },
    },
  },
  plugins: [],
};
export default config;
