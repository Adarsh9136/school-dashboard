/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
        brand: {
          maroon: '#7A1022',
          forest: '#1E3F2D',
          gold: '#C4A454',
          cream: '#FDFBF7',
          ink: '#1A1A1A',
        },
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'aurora': {
          '0%,100%': { transform: 'translate(0,0) scale(1)', opacity: '0.6' },
          '50%': { transform: 'translate(4%,-3%) scale(1.15)', opacity: '0.9' },
        },
        'float-slow': {
          '0%,100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-14px) rotate(4deg)' },
        },
        'shine': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'flash-green': {
          '0%': { backgroundColor: 'rgba(30,63,45,0)', transform: 'scale(1)' },
          '30%': { backgroundColor: 'rgba(30,63,45,0.35)', transform: 'scale(1.06)' },
          '100%': { backgroundColor: 'rgba(30,63,45,0.12)', transform: 'scale(1)' },
        },
        'flash-red': {
          '0%': { backgroundColor: 'rgba(122,16,34,0)', transform: 'scale(1)' },
          '30%': { backgroundColor: 'rgba(122,16,34,0.35)', transform: 'scale(1.06)' },
          '100%': { backgroundColor: 'rgba(122,16,34,0.12)', transform: 'scale(1)' },
        },
        'shake': {
          '0%,100%': { transform: 'translateX(0)' },
          '20%,60%': { transform: 'translateX(-6px)' },
          '40%,80%': { transform: 'translateX(6px)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'aurora': 'aurora 14s ease-in-out infinite',
        'float-slow': 'float-slow 8s ease-in-out infinite',
        'shine': 'shine 2.4s linear infinite',
        'flash-green': 'flash-green 0.7s ease-out',
        'flash-red': 'flash-red 0.7s ease-out',
        'shake': 'shake 0.4s ease-in-out',
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E\")",
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
};
