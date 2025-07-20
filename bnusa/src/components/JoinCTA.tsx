'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/utils/themeContext';

const JoinCTA = () => {
  const { reduceMotion } = useTheme();

  return (
    <section className="py-12 relative overflow-hidden">
      {/* Blue blurry background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-white via-blue-50 to-white z-0"></div>
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-blue-400/20 blur-3xl z-0"></div>
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-[var(--primary)]/20 blur-3xl z-0"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-blue-300/10 blur-3xl z-0"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto backdrop-blur-md bg-white/60 rounded-xl px-6 py-8 border border-white/80">
          {/* Compact header with minimal styling */}
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-[var(--foreground)]">
              دەستپێبکە بە نووسین لە بنووسە
            </h2>
            
            <p className="text-base mb-6 text-[var(--grey-dark)] max-w-xl mx-auto">
              دەنگی خۆت بگەیەنە بە جیهان و بەشداری بکە لە دروستکردنی کۆمەڵگایەکی زیندوو.
            </p>
          </div>
          
          {/* Compact buttons with subtle hover effects */}
          <div className="flex flex-row justify-center gap-4 mb-4">
            <Link
              href="/signup"
              className="bg-[var(--primary)] text-white transition-all py-2 px-6 rounded-md font-medium text-base hover:bg-[var(--primary-dark)] duration-200 text-center"
            >
              دروستکردنی هەژمار
            </Link>
            <Link
              href="/write-here"
              className="bg-white/80 backdrop-blur-sm text-[var(--primary)] border border-[var(--primary)]/30 hover:bg-[var(--primary)]/5 transition-all py-2 px-6 rounded-md font-medium text-base duration-200 text-center"
            >
              دەستپێکردن بە نووسین
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JoinCTA; 