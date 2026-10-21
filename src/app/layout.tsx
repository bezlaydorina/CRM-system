import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { RegisterServiceWorker } from "@/components/register-service-worker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Code CRM",
  description: "The Code ügynökségi CRM és ügyfélportál",
};

export const viewport: Viewport = {
  themeColor: "#4a102a",
};

const THEME_INIT_SCRIPT = `
try {
  var mode = localStorage.getItem("theme") || "system";
  var isDark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  if (isDark) document.documentElement.classList.add("dark");
} catch (e) {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="hu"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Blokkoló script a hidratáció előtt, hogy ne villanjon fel a rossz téma (FOUC) - lásd ThemeToggle. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-brand-bg text-brand-text">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
