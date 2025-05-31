
"use client"

import * as React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

type Theme = "dark" | "light" | "system"

type ThemeProviderContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderContextType | undefined>(undefined)

export function ThemeProvider({ 
  children, 
  defaultTheme = "system", 
  ...props 
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme as Theme)
  
  return (
    <NextThemesProvider {...props} defaultTheme={defaultTheme}>
      <ThemeProviderContext.Provider value={{ theme, setTheme }}>
        {children}
      </ThemeProviderContext.Provider>
    </NextThemesProvider>
  )
}

export const useTheme = (): { theme: Theme; setTheme: (theme: Theme) => void } => {
  const context = useContext(ThemeProviderContext)
  
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  
  return {
    theme: context.theme,
    setTheme: (theme: Theme) => {
      context.setTheme(theme)
    }
  }
}
