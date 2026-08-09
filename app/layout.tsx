import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL("https://english-code-concept.sharan19.chatgpt.site"),
  title: "Source Twin | Readable Software Logic",
  description:
    "A version-controlled, plain-language semantic twin connected to source code, tests, coverage, and Git review.",
  openGraph: {
    title: "Source Twin",
    description: "Read the software without translating the code.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Source Twin connects readable product logic to source code." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Source Twin",
    description: "Read the software without translating the code.",
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
