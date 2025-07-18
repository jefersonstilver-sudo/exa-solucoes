import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Cores específicas do Indexa - updated with more vibrant colors
				indexa: {
					purple: '#4A0968',
					'purple-dark': '#38064F',
					'purple-light': '#6A1888',
					mint: '#58E3AB',
					'mint-dark': '#4AD399',
					'mint-light': '#7EEAC0',
					white: '#FFFFFF'
				},
				// Cores LINKAÊ expandidas com novos acentos
				linkae: {
					'dark-blue': '#1a1b5c',      // Azul escuro principal
					'royal-blue': '#2c3094',     // Azul royal médio  
					'bright-blue': '#4da6ff',    // Azul vibrante
					'cyan-light': '#5bc0eb',     // Cyan claro para CTAs
					'accent-pink': '#FF8A80',    // Rosa accent (NOVO)
					'accent-orange': '#F57C00',  // Laranja accent (NOVO)
					'white': '#ffffff',          // Branco puro
					'gradient-start': '#1a1b5c', // Início dos gradientes
					'gradient-end': '#2837a8'    // Final dos gradientes
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				'2xl': '1rem'
			},
			boxShadow: {
				'enhanced': '0 10px 30px -5px rgba(74, 9, 104, 0.15), 0 8px 10px -6px rgba(74, 9, 104, 0.1)',
				'enhanced-hover': '0 20px 35px -5px rgba(74, 9, 104, 0.2), 0 10px 15px -5px rgba(74, 9, 104, 0.15)',
				'card-hover': '0 20px 30px -10px rgba(0, 0, 0, 0.15)',
				'linkae-glow': '0 0 40px rgba(255, 138, 128, 0.3)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-in': {
					'0%': {
						transform: 'translateY(20px)',
						opacity: '0'
					},
					'100%': {
						transform: 'translateY(0)',
						opacity: '1'
					}
				},
				'float': {
					'0%, 100%': {
						transform: 'translateY(0)'
					},
					'50%': {
						transform: 'translateY(-10px)'
					}
				},
				'pulse-soft': {
					'0%, 100%': {
						opacity: '1'
					},
					'50%': {
						opacity: '0.7'
					}
				},
				'cart-bubble': {
					'0%': {
						transform: 'scale(1)',
					},
					'50%': {
						transform: 'scale(1.2)',
					},
					'100%': {
						transform: 'scale(1)',
					}
				},
				'linkae-glow': {
					'0%, 100%': { 
						boxShadow: '0 0 20px rgba(77, 166, 255, 0.3)' 
					},
					'50%': { 
						boxShadow: '0 0 30px rgba(91, 192, 235, 0.5)' 
					}
				},
				'linkae-float': {
					'0%, 100%': { 
						transform: 'translateY(0px) scale(1)' 
					},
					'50%': { 
						transform: 'translateY(-10px) scale(1.02)' 
					}
				},
				'linkae-zoom': {
					'0%': { 
						transform: 'scale(1)' 
					},
					'100%': { 
						transform: 'scale(1.15)' 
					}
				},
				'accent-pulse': {
					'0%, 100%': { 
						boxShadow: '0 0 20px rgba(255, 138, 128, 0.4)' 
					},
					'50%': { 
						boxShadow: '0 0 40px rgba(245, 124, 0, 0.6)' 
					}
				},
				'gradient-shift': {
					'0%': { 
						backgroundPosition: '0% 50%' 
					},
					'50%': { 
						backgroundPosition: '100% 50%' 
					},
					'100%': { 
						backgroundPosition: '0% 50%' 
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.4s ease-out',
				'slide-in': 'slide-in 0.5s ease-out',
				'float': 'float 3s ease-in-out infinite',
				'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
				'cart-bubble': 'cart-bubble 0.6s ease-out',
				'linkae-glow': 'linkae-glow 2s ease-in-out infinite',
				'linkae-float': 'linkae-float 3s ease-in-out infinite',
				'linkae-zoom': 'linkae-zoom 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
				'accent-pulse': 'accent-pulse 3s ease-in-out infinite',
				'gradient-shift': 'gradient-shift 6s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
