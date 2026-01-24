import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from 'sonner';
import VersionCheck from "@/components/VersionCheck";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Levelone",
  description: "Phase-Based Learning Management System - sab ka sath sab vikas",
};

import NotificationListener from "@/components/NotificationListener";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <VersionCheck />
          <NotificationListener />
          {children}
          <Toaster richColors position="top-center" />
        </AuthProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
                window.addEventListener('load', function() {
                  if (navigator.serviceWorker) {
                      // EMERGENCY FIX: Unregister all existing SWs first
                      navigator.serviceWorker.getRegistrations().then(function(registrations) {
                        for(let registration of registrations) {
                          console.log('Unregistering SW:', registration);
                          registration.unregister();
                        }
                        
                        // Re-register safe version
                        setTimeout(() => {
                            navigator.serviceWorker.register('/sw.js').then(function(registration) {
                                console.log('Safe SW registered');
                            }).catch(console.error);
                        }, 500);
                      });
                  }
                });
              }

              // CRITICAL FALLBACK: Auto-reload on Chunk Load Errors (404)
              window.addEventListener('error', function(e) {
                var isChunkError = e.message && (
                  e.message.includes('Loading chunk') || 
                  e.message.includes('Loading CSS chunk') ||
                  e.message.includes('missing')
                );
                var isScriptError = e.target && (e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK');
                
                if (isChunkError || isScriptError) {
                  // Check if it's a 404/network error for a critical asset
                  var targetSrc = e.target ? (e.target.src || e.target.href) : '';
                  var isAppChunk = targetSrc && (targetSrc.includes('_next') || targetSrc.includes('main'));
                  
                  if (e.message || isAppChunk) {
                    console.error('🚨 Critical Chunk Load Error detected:', e.target);
                    // Prevent infinite reload loops (limit to 1 reload per 10 seconds)
                    var lastReload = sessionStorage.getItem('chunk_reload_ts');
                    var now = Date.now();
                    
                    if (!lastReload || (now - parseInt(lastReload) > 10000)) {
                      console.log('🔄 Force reloading to fetch fresh chunks...');
                      sessionStorage.setItem('chunk_reload_ts', now.toString());
                      // Clear cache and reload
                      if ('caches' in window) {
                         caches.keys().then(function(names) {
                            for (var name of names) caches.delete(name);
                         });
                      }
                      window.location.reload(true);
                    }
                  }
                }
              }, true); // Capture phase is essential to catch resource loading errors
            `,
          }}
        />
      </body>
    </html>
  );
}
