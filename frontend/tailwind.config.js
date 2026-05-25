export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary:   '#1A56DB',
        accent:    '#FBBF24',
        success:   '#16A34A',
        danger:    '#DC2626',
        dark:      '#111827',
        muted:     '#6B7280',
        surface:   '#F9FAFB',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.6s ease-out',
      },
    },
  },
};
