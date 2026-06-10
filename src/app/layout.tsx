import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from 'sonner';
import VersionCheck from "@/components/VersionCheck";
import PWADriver from "@/components/PWADriver";
import NotificationListener from "@/components/NotificationListener";
import QueryProvider from "@/components/QueryProvider";
import { Suspense } from 'react';
import VercelAnalytics from "@/components/VercelAnalytics";
import GlobalSplashScreen from "@/components/GlobalSplashScreen";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#030303",
  viewportFit: "cover",
  // Prevents Android keyboard from resizing the layout viewport
  // so fixed/sticky headers don't get pushed off screen
  interactiveWidget: "resizes-visual",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // prevents invisible text during font load
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// NOTE: force-dynamic / revalidate=0 removed from root layout.
// Setting these globally kills all Next.js RSC caching across every route.
// Add them only on the specific page/route that needs fresh data.

export const metadata: Metadata = {
  title: "Levelone",
  description: "Phase-Based Learning Management System - sab ka sath sab vikas",
  icons: {
    icon: '/icon-ninja-round.png',
    apple: '/icon-ninja-round.png',
    shortcut: '/icon-ninja-round.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest?v=2" />
        <link rel="icon" type="image/png" href="/icon-ninja-round.png" />
        <link rel="apple-touch-icon" href="/icon-ninja-round.png" />
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <QueryProvider>
          <GlobalSplashScreen />
          <AuthProvider>
            {/* Background utilities each get their own Suspense — they don't block each other or the page */}
            <Suspense fallback={null}>
              <VersionCheck />
            </Suspense>
            <Suspense fallback={null}>
              <PWADriver />
            </Suspense>
            <Suspense fallback={null}>
              <NotificationListener />
            </Suspense>

            {/* Page content with its own loading state */}
            <Suspense fallback={
              <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#050507] z-[9999]">
                <div className="relative flex flex-col items-center animate-fade-in-up">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-600/30 blur-[60px] rounded-full animate-pulse" />
                  
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src="/icon-ninja-round.png" 
                    alt="Levelone Ninja" 
                    className="w-32 h-32 relative z-10 rounded-full shadow-[0_0_40px_rgba(59,130,246,0.3)] animate-float"
                  />
                  
                  <h1 className="mt-8 text-3xl font-black tracking-[-0.05em] text-white relative z-10">
                    LEVELONE
                  </h1>
                  <div className="mt-4 flex gap-2 relative z-10">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            }>
              {children}
            </Suspense>

            <VercelAnalytics />
            <SpeedInsights />
            <Toaster richColors position="top-center" />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
