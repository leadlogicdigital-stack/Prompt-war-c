import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import { SukoonProvider } from "@/lib/store";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sukoon — your calm corner for the exam grind",
  description:
    "A proactive, India-specific mental wellness companion for students preparing for high-stakes competitive exams. Calibrated to you, here before you ask.",
};

export const viewport: Viewport = {
  themeColor: "#f8f6fc",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        <SukoonProvider>{children}</SukoonProvider>
      </body>
    </html>
  );
}
