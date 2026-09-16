"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export { useTheme } from "next-themes";

/** Narrower than next-themes' own `string | undefined`. */
export type Theme = "system" | "light" | "dark";

/**
 * Pre-paint class + `color-scheme` are next-themes' job; see `disableTransitionOnChange`
 * (it freezes transitions for the frame the class flips, which is what made the toggle
 * feel heavy) and `enableColorScheme` (native scrollbars and form controls).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme
      disableTransitionOnChange
      storageKey="theme"
    >
      {children}
    </NextThemesProvider>
  );
}
