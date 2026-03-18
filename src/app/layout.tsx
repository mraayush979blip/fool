import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from 'sonner';
import VersionCheck from "@/components/VersionCheck";
import NotificationListener from "@/components/NotificationListener";
import QueryProvider from "@/components/QueryProvider";
import { Suspense } from 'react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Levelone",
  description: "Phase-Based Learning Management System - sab ka sath sab vikas",
};

import VercelAnalytics from "@/components/VercelAnalytics";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Force fresh builds and purge Edge caches */}
        <meta name="build-id" content={Date.now().toString()} />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function hE(e) {
                  var m = (e.message || (e.reason && e.reason.message) || '').toLowerCase();
                  if (m.includes('chunkloaderror') || m.includes('failed to fetch dynamically imported module') || m.includes('unexpected token \\'<\\'')) {
                    if (sessionStorage.getItem('lv1_sync') === '1') return;
                    sessionStorage.setItem('lv1_sync', '1');
                    var u = new URL(window.location.href);
                    u.searchParams.set('sync', Date.now().toString());
                    window.location.href = u.toString();
                  }
                }
                window.addEventListener('error', hE, true);
                window.addEventListener('unhandledrejection', function(e) { hE(e); });
              })();
            `
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            <Suspense fallback={
                <div className="fixed inset-0 flex items-center justify-center bg-background z-[9999]">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            }>
              <VersionCheck />
              <NotificationListener />
              {children}
            </Suspense>
            <VercelAnalytics />
            <Toaster richColors position="top-center" />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
