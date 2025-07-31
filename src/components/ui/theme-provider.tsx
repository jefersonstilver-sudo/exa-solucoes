
import * as React from "react"
import { createContext, useContext, useState, ReactNode } from "react"

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

export function ThemeProvider({ 
  children, 
  defaultTheme = "light"
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  
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
