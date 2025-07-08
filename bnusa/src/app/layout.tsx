import React from 'react';
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ThemeProvider } from "../utils/themeContext";
import AccessibilitySettings from '../components/AccessibilitySettings';
import ScrollToTop from '../components/ScrollToTop';
import localFont from 'next/font/local';
import AuthWrapper from '../components/auth/AuthWrapper';
import { ToastProvider } from '../context/ToastContext';
import B2ImagePreloader from '../components/B2ImagePreloader';
import ServiceWorkerRegistration from '../components/ServiceWorkerRegistration';

// Import the local Rabar font
const rabarFont = localFont({
  src: '../../public/fonts/Rabar_022.ttf',
  variable: '--font-rabar',
  display: 'swap',
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "بنووسە",
  description: "پلاتفۆرمێکی نوێ بۆ وتارەکانی کوردی لەسەر زانست، مێژوو، هونەر، و زیاتر.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "بنووسە",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#1b65e3",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ku" dir="rtl">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#1b65e3" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body
        className={`${rabarFont.variable} ${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <AuthWrapper>
          <ThemeProvider>
            <ToastProvider>
              <Navbar />
              <main className="flex-grow pt-24">
                {children}
              </main>
              <Footer />
              <AccessibilitySettings />
              <ScrollToTop />
              <ServiceWorkerRegistration />
            </ToastProvider>
          </ThemeProvider>
        </AuthWrapper>
      </body>
    </html>
  );
}
