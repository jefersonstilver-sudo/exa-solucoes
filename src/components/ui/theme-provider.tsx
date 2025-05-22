
"use client"

import * as React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

type Theme = "dark" | "light" | "system"

type ThemeContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ 
  children, 
  defaultTheme = "system", 
  ...props 
}: ThemeProviderProps) {
  return <NextThemesProvider {...props} defaultTheme={defaultTheme}>{children}</NextThemesProvider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  const { setTheme: setNextTheme, theme: activeTheme } = useTheme_internal()
  
  const setTheme = (theme: Theme) => {
    setNextTheme(theme)
  }
  
  return {
    setTheme,
    theme: activeTheme as Theme,
  }
}

// Internal hook directly from next-themes
function useTheme_internal() {
  const { resolvedTheme, theme, setTheme } = useContext(NextThemesProvider.Context)
  return {
    theme: resolvedTheme || theme,
    setTheme,
  }
}
