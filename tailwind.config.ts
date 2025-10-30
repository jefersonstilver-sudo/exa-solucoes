
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
			fontFamily: {
				'playfair': ['Playfair Display', 'serif'],
				'montserrat': ['Montserrat', 'sans-serif'],
				'orbitron': ['Orbitron', 'monospace'],
				'exo-2': ['Exo 2', 'sans-serif'],
				'space-mono': ['Space Mono', 'monospace'],
			},
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
				// Cores específicas do EXA - usando HSL
				'exa-purple': 'hsl(var(--exa-purple))',
				'exa-mint': 'hsl(var(--exa-mint))',
				'exa-purple-dark': 'hsl(var(--exa-purple-dark))',
				// Novas cores LINKAÊ usando as variáveis HSL
				linkae: {
					primary: 'hsl(var(--linkae-primary))',
					secondary: 'hsl(var(--linkae-secondary))',
					accent: 'hsl(var(--linkae-accent))',
					cyan: 'hsl(var(--linkae-cyan))',
					white: 'hsl(var(--linkae-white))'
				},
				// Cores EXA - Nova identidade
				exa: {
					purple: '#5E3D8C',
					black: '#0A0A0A',
					yellow: '#FFD54F',
					blue: '#4FC3F7',
					white: '#FFFFFF',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				'2xl': '1rem' // Added 2xl border radius
			},
			boxShadow: {
				'enhanced': '0 10px 30px -5px rgba(74, 9, 104, 0.15), 0 8px 10px -6px rgba(74, 9, 104, 0.1)',
				'enhanced-hover': '0 20px 35px -5px rgba(74, 9, 104, 0.2), 0 10px 15px -5px rgba(74, 9, 104, 0.15)',
				'card-hover': '0 20px 30px -10px rgba(0, 0, 0, 0.15)'
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
				'fade-up': {
					'0%': {
						opacity: '0',
						transform: 'translateY(30px)'
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
				'counter': {
					'0%': {
						transform: 'scale(0.5)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				'parallax': {
					'0%': {
						transform: 'translateY(0px)'
					},
					'100%': {
						transform: 'translateY(-50px)'
					}
				},
				'scroll-left': {
					'0%': {
						transform: 'translateX(0)'
					},
					'100%': {
						transform: 'translateX(-50%)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.4s ease-out',
				'fade-up': 'fade-up 0.6s ease-out',
				'slide-in': 'slide-in 0.5s ease-out',
				'float': 'float 3s ease-in-out infinite',
				'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
				'cart-bubble': 'cart-bubble 0.6s ease-out',
				'linkae-glow': 'linkae-glow 2s ease-in-out infinite',
				'linkae-float': 'linkae-float 3s ease-in-out infinite',
				'linkae-zoom': 'linkae-zoom 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
				'counter': 'counter 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
				'parallax': 'parallax 1s ease-out',
				'scroll-left': 'scroll-left 30s linear infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
