'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '@/utils/themeContext';
import { useEffect, useState } from 'react';
import Iridescence from './LiquidChrome';

const HeroSection = () => {
  const { reduceMotion } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Trigger the animation after component mount
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  const animationClass = reduceMotion ? '' : 'transition-all duration-700 ease-out';
  
  return (
    <section className="relative py-20 overflow-hidden hero-rabar21">
      <style>{`
        html[dir="rtl"] .hero-rabar21, .hero-rabar21 {
          font-family: 'Rabar 021', sans-serif !important;
        }
      `}</style>
      {/* Iridescence Background */}
      <Iridescence
        color={[1, 1, 1]}
        speed={1.3}
        amplitude={0.1}
        mouseReact={true}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
        }}
      />
      
      {/* White Overlay */}
      <div 
        className="absolute inset-0"
        style={{ zIndex: 0, background: 'rgba(255,255,255,0.47)' }}
      />
      
      <div className="container mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className={`flex flex-col space-y-6 ${animationClass} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '100ms' }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-800">
              پلاتفۆرمی <span className="text-[var(--primary)]">زانیاری</span> کوردی
            </h1>
            <p className="text-lg text-gray-700 max-w-lg">
              <span className="text-[var(--primary)]">بنووسە</span>، دەنگی ژیری کوردییە. لێرەدا وتار و کتێبەکانت بە زمانی کوردی بڵاو بکەوە و بخوێنەوە، <span className="text-[var(--primary)]">بنووسە کۆگایەکی نووسین و کتێبخانەی کوردییە</span> بۆ هەموو کەسێک.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/publishes" className="btn btn-primary px-8 py-3 text-center">
                بڵاوکراوەکان
              </Link>
              <Link href="/write-here" className="btn btn-outline px-8 py-3 text-center">
                دەستبکە بە نووسین
              </Link>
            </div>
            <div className="flex items-center space-x-4 pt-4">
              <div className="flex -space-x-2">
                {[   'بـ','نـ', 'وو','سـ','ـە',].map((initials, i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-[var(--primary)] flex items-center justify-center text-white font-medium overflow-hidden">
                    {initials}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600">
                
                <span className="text-[var(--primary)]">بەشداری نووسەرانی دیکە لەسەر پلاتفۆرمەکە بکە</span>
                 
              </p>
            </div>
          </div>
          <div 
            className={`relative h-[300px] sm:h-[400px] lg:h-[500px] rounded-lg overflow-hidden ${animationClass} ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
            style={{ transitionDelay: '250ms' }}
          >
            {/* Featured Article Image */}
            <Image
              src="/images/img/bnusa-name.png"
              alt="وتاری تایبەت لەسەر ئەدەبی کوردی"
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            <div className="absolute bottom-6 left-6 right-6">
              <h3 className="text-white text-xl font-bold mb-2">وتارەکان</h3>
              <p className="text-white/90 line-clamp-2">بخوێنەوە و بنووسە بە زمانی کوردی، هەنگاوێک بۆ دەوڵەمەندتر کردن و فراوان کردنی زمانی کوردی</p>
              <Link 
                href="/publishes" 
                className="inline-flex items-center mt-4 text-white font-medium hover:text-[var(--primary-light)] transition-colors duration-200"
              >
                زیاتر لە وتارەکان
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Bottom Gradient to Gray-50 */}
      <div className="absolute left-0 right-0 bottom-0 h-24 pointer-events-none z-20" style={{background: 'linear-gradient(to bottom, transparent, var(--color-gray-50) 90%)'}} />
    </section>
  );
};

export default HeroSection; 