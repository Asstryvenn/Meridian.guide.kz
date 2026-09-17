import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter, Manrope } from "next/font/google";
import { MotionProvider } from "@/components/theme/motion-provider";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider, themeBootScript } from "@/components/theme/theme-provider";
import { AppProvider } from "@/lib/store/app-store";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });
const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-manrope", display: "swap" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });

export const metadata: Metadata = {
  title: "LOCUS — Find the universities that fit you",
  description: "Personal university navigation: portfolio diagnostics, Dream/Target/Safety matching, admission estimates, scholarships and a step-by-step application roadmap.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5EED2" },
    { media: "(prefers-color-scheme: dark)", color: "#132228" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable} ${instrument.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <ThemeProvider>
          <MotionProvider>
            <ToastProvider>
              <AppProvider>{children}</AppProvider>
            </ToastProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
