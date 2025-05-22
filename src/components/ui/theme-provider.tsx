
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
  const { resolvedTheme, theme, setTheme } = useThemeInternal()
  
  return {
    setTheme: setTheme as (theme: Theme) => void,
    theme: (resolvedTheme || theme) as Theme,
  }
}

// Internal hook directly from next-themes
function useThemeInternal() {
  // Access the context properly from the next-themes library
  const context = useContext(NextThemesProvider.Context)
  
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  
  return {
    theme: context.theme,
    resolvedTheme: context.resolvedTheme,
    setTheme: context.setTheme,
  }
}
