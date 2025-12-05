import * as React from "react"
import { createContext, useContext, useState, useEffect, ReactNode } from "react"

type Theme = "light" | "dark"

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderContextType | undefined>(undefined)

const STORAGE_KEY = 'app-theme'

export function ThemeProvider({ 
  children, 
  defaultTheme = "light"
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        return stored as Theme;
      }
    }
    return defaultTheme;
  });
  
  useEffect(() => {
    // Persist to localStorage
    localStorage.setItem(STORAGE_KEY, theme);
    
    // Sync with DOM
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    console.log('🎨 Theme updated:', theme);
  }, [theme]);

  // Ensure initial state is synced on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // If nothing stored, ensure DOM matches default
      const root = document.documentElement;
      if (defaultTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [defaultTheme]);
  
  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = (): { theme: Theme; setTheme: (theme: Theme) => void } => {
  const context = useContext(ThemeProviderContext)
  
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  
  return context
}
