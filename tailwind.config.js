/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terracotta: {
          DEFAULT: '#F25C2A',
          hover: '#FF6B35',
          dark: '#D94C1D',
          deep: '#AA3000',
          container: '#FFDBD0',
        },
        sage: {
          DEFAULT: '#2A9D8F',
          dark: '#006A60',
          container: '#8CF5E4',
          tint: '#E6F4F1',
        },
        coral: {
          DEFAULT: '#E76F51',
          dark: '#A03B21',
        },
        canvas: {
          DEFAULT: '#FDFBF7',
          surface: '#FFFFFF',
          tint: '#F4F0E8',
        },
        slate: {
          deep: '#1E293B',
          muted: '#475569',
          subtle: '#64748B',
          light: '#94A3B8',
          border: 'rgba(30, 41, 59, 0.08)',
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        }
      },
      fontFamily: {
        display: ['Epilogue', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        level1: '0 2px 8px -2px rgba(242, 92, 42, 0.05), 0 1px 4px -1px rgba(30, 41, 59, 0.04)',
        level2: '0 12px 28px -4px rgba(30, 41, 59, 0.08), 0 4px 12px -2px rgba(242, 92, 42, 0.06)',
        level3: '0 16px 36px -6px rgba(242, 92, 42, 0.20)',
        subtle: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
      },
      borderRadius: {
        'card': '20px',
        'input': '12px',
        'button': '14px',
      }
    },
  },
  plugins: [],
}
