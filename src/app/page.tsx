'use client';

import { useAuth } from '@/contexts/AuthContext';
import NeonLoader from '@/components/NeonLoader';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ArrowRight, Code, Terminal, Zap, BookOpen, Rocket } from 'lucide-react';
import { StaggerContainer, StaggerItem } from '@/components/ui/motion-wrapper';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Only redirect if logged in
    if (!loading) {
      if (user) {
        if (user.role === 'admin') window.location.href = '/admin';
        else window.location.href = '/student';
      } else {
        // Show landing page content if not logged in
        setShowContent(true);
      }
    }
  }, [user, loading, router]);

  if (loading || (!showContent && user)) {
    return <NeonLoader />;
  }

  // If user is null and not loading, we show the landing page
  if (!user && showContent) {
    return (
      <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#050507] selection:bg-blue-500/30 selection:text-white">
        
        {/* Dynamic Light Beams */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="container px-4 md:px-6 z-10 relative">
          <StaggerContainer className="flex flex-col items-center text-center space-y-8">
            <StaggerItem>
              <div className="inline-flex items-center rounded-full border border-blue-900/50 bg-[#090a0f]/80 px-4 py-1.5 text-xs tracking-widest uppercase font-bold text-blue-400 backdrop-blur-md shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-3 animate-pulse shadow-[0_0_10px_#3b82f6]"></span>
                LevelOne Learning Platform
              </div>
            </StaggerItem>

            <StaggerItem>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white drop-shadow-lg font-sans leading-tight">
                Master the Art <br className="hidden md:inline" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 animate-pulse">of Clean Code</span>
              </h1>
            </StaggerItem>

            <StaggerItem>
              <p className="max-w-[700px] text-zinc-400 font-medium md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed tracking-wide">
                Learn fast, build effectively, and execute perfectly. Embark on the ultimate gamified journey to become a master developer.
              </p>
            </StaggerItem>

            <StaggerItem>
              <div className="flex flex-col sm:flex-row gap-5 w-full justify-center pt-6">
                <Link href="/login" className="btn-liquid-metal group inline-flex h-14 items-center justify-center px-10 font-bold text-sm tracking-widest uppercase">
                  <span className="btn-liquid-metal-inner mr-2 flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-blue-400" />
                    Get Started
                  </span>
                  <ArrowRight className="h-4 w-4 text-blue-400 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </StaggerItem>
          </StaggerContainer>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20" staggerDelay={0.2}>
            <StaggerItem>
              <div className="group h-full rounded-2xl border border-zinc-800 bg-[#090a0f]/50 p-8 backdrop-blur-xl transition duration-500 hover:bg-[#0f121d] hover:border-blue-900/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#050507] border border-blue-900/50 text-blue-400 shadow-inner group-hover:scale-110 transition-transform">
                  <Terminal className="h-5 w-5" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-white tracking-tight">Advanced Sandbox</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">Write elegant, performant code that compiles flawlessly in our advanced browser sandbox.</p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="group h-full rounded-2xl border border-zinc-800 bg-[#090a0f]/50 p-8 backdrop-blur-xl transition duration-500 hover:bg-[#0f121d] hover:border-purple-900/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)]">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#050507] border border-purple-900/50 text-purple-400 shadow-inner group-hover:scale-110 transition-transform">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-white tracking-tight">Gamified Mastery</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">Earn legendary ranks. Progress from beginner to professional as you conquer challenges.</p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="group h-full rounded-2xl border border-zinc-800 bg-[#090a0f]/50 p-8 backdrop-blur-xl transition duration-500 hover:bg-[#0f121d] hover:border-blue-900/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#050507] border border-blue-900/50 text-blue-400 shadow-inner group-hover:scale-110 transition-transform">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-white tracking-tight">Structured Curriculum</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">Unlock the secrets of modern web development through our curated, structured curriculum.</p>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </main>
    );
  }

  return null;
}
