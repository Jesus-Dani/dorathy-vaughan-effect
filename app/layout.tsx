import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "The Dorothy Vaughan Effect",
  description:
    "Find out where your industry is heading and the one skill move worth making right now.",
  openGraph: {
    title: "The Dorothy Vaughan Effect",
    description:
      "AI isn't erasing your job — it's raising the standard. Find out the exact move to get ahead of the wave.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="h-full flex flex-col">{children}</body>
    </html>
  );
}
