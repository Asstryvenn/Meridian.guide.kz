import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import { MotionProvider } from "@/components/theme/motion-provider";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider, themeBootScript } from "@/components/theme/theme-provider";
import { AppProvider } from "@/lib/store/app-store";
import { I18nProvider } from "@/components/i18n/i18n-context";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700", "800"], variable: "--font-montserrat", display: "swap" });

export const metadata: Metadata = {
  title: "Meridian Guide",
  description: "Personal university admissions guidance by team Flaxyss: portfolio diagnostics, Dream/Target/Safety matching, admission estimates, document vault, interview simulator, and step-by-step application roadmap.",
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
    <html lang="en" className={`${inter.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <ThemeProvider>
          <MotionProvider>
            <ToastProvider>
              <AppProvider>
                <I18nProvider>{children}</I18nProvider>
              </AppProvider>
            </ToastProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
