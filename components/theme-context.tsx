"use client";
import { ThemeProvider } from 'next-themes';
export default function ThemeContext({children}:{children:React.ReactNode}) {return <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false} storageKey="claimlens-theme">{children}</ThemeProvider>;}

