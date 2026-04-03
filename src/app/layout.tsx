import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OilFinder — AI-Powered Oil Recommendations",
  description:
    "Type your car, get the right oil. AI-powered recommendations grounded in manufacturer specs.",
  openGraph: {
    title: "OilFinder — AI-Powered Oil Recommendations",
    description:
      "Type your car, get the right oil. Grounded in manufacturer specs.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} antialiased`}>
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
