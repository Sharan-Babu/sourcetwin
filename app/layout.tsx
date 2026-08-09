import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { siteUrl } from "./site-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "Source Twin | Understand Software in Plain English",
  description:
    "Keep a readable mirror of your software beside the code. Understand behavior, plan changes, and review code and tests with your coding agent.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Source Twin",
    description: "Understand your software in plain English.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "A readable Source Twin file connected to code and tests." }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Source Twin",
    description: "Understand your software in plain English.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
