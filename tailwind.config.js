/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors: {
				border: '#E5E7EB',
				input: '#E5E7EB',
				ring: '#2D5A27',
				background: '#F9FAFB',
				foreground: '#1F2937',
				primary: {
					DEFAULT: '#2D5A27',
					foreground: '#ffffff',
					light: '#3D7A37',
					dark: '#1D4A17',
				},
				secondary: {
					DEFAULT: '#F5F5F5',
					foreground: '#1F2937',
				},
				accent: {
					DEFAULT: '#FFA500',
					foreground: '#ffffff',
				},
				destructive: {
					DEFAULT: '#EF4444',
					foreground: '#ffffff',
				},
				success: {
					DEFAULT: '#10B981',
					foreground: '#ffffff',
				},
				muted: {
					DEFAULT: '#F9FAFB',
					foreground: '#6B7280',
				},
				popover: {
					DEFAULT: '#ffffff',
					foreground: '#1F2937',
				},
				card: {
					DEFAULT: '#ffffff',
					foreground: '#1F2937',
				},
			},
			borderRadius: {
				lg: '0.5rem',
				md: '0.375rem',
				sm: '0.25rem',
			},
			keyframes: {
				'accordion-down': {
					from: { height: 0 },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: 0 },
				},
				'pulse-glow': {
					'0%, 100%': { opacity: 1 },
					'50%': { opacity: 0.5 },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}
