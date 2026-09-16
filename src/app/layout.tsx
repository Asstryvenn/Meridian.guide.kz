import type { Metadata, Viewport } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import { MotionProvider } from "@/components/theme/motion-provider";
import { ThemeProvider, themeBootScript } from "@/components/theme/theme-provider";
import { AppProvider } from "@/lib/store/app-store";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument" });

export const metadata: Metadata = {
  title: "LOCUS — Find the universities that fit you",
  description: "Personal university navigation: portfolio diagnostics, Dream/Target/Safety matching, admission estimates, scholarships and a step-by-step application roadmap.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5EED2" },
    { media: "(prefers-color-scheme: dark)", color: "#132228" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${instrument.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <ThemeProvider>
          <MotionProvider>
            <AppProvider>{children}</AppProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
