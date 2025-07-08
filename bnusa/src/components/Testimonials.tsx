'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTheme } from '@/utils/themeContext';

const Testimonials = () => {
  const { reduceMotion } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const testimonials = [
    {
      id: 1,
      name: 'شادی عەزیز',
      role: 'نووسەر و ڕۆژنامەنووس',
      image: '/images/placeholders/avatar-primary.png',
      quote: 'بنووسا توانیویەتی پلاتفۆرمێکی نایاب دابین بکات بۆ نووسینی کوردی. من توانیم لە ماوەی شەش مانگدا زیاتر لە ٢٠ وتار بڵاو بکەمەوە و هەزاران خوێنەر بگەن بە وتارەکانم.',
    },
    {
      id: 2,
      name: 'کارزان محەمەد',
      role: 'مامۆستای زانکۆ',
      image: '/images/placeholders/avatar-primary.png',
      quote: 'وەک مامۆستای زانکۆ، بنووسا دەرفەتێکی زۆر باشی بۆ ڕەخساندم کە توێژینەوەکانم بە شێوەیەکی ئاسان بگەیەنمە خوێنەرانی کورد. سوپاس بۆ ئەم هەوڵە بەنرخە.',
    },
    {
      id: 3,
      name: 'شەیدا ئەحمەد',
      role: 'خوێندکار',
      image: '/images/placeholders/avatar-primary.png',
      quote: 'بنووسا بۆ من وەک خوێندکار سەرچاوەیەکی زۆر گرنگە بۆ خوێندنەوە و فێربوون. هەروەها توانیم یەکەم وتاری خۆم لێرە بڵاو بکەمەوە و فێری زۆر شت بووم.',
    },
  ];

  // Function to handle smooth slide transition
  const goToSlide = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveIndex(index);
    
    // Reset transitioning state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 800); // Increased for smoother transitions
  };

  // Handle next and previous navigation
  const goToPrevSlide = () => {
    const prevIndex = (activeIndex - 1 + testimonials.length) % testimonials.length;
    goToSlide(prevIndex);
  };

  const goToNextSlide = () => {
    const nextIndex = (activeIndex + 1) % testimonials.length;
    goToSlide(nextIndex);
  };

  // Auto-advance carousel
  useEffect(() => {
    if (reduceMotion) return;
    
    const interval = setInterval(() => {
      if (!isTransitioning) {
        goToNextSlide();
      }
    }, 6000);
    
    return () => clearInterval(interval);
  }, [reduceMotion, activeIndex, isTransitioning]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToNextSlide();
      } else if (e.key === 'ArrowRight') {
        goToPrevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, isTransitioning]);

  return (
    <section className="py-28 bg-white relative overflow-hidden">
      {/* Background decorative icons */}
      <div className="absolute top-12 left-10 text-blue-100 opacity-5 transform rotate-12">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      </div>
      <div className="absolute bottom-20 right-10 text-blue-100 opacity-5 transform -rotate-12">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-40 w-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="mb-2 inline-flex items-center justify-center opacity-60">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">بیروڕای بەکارهێنەران</h2>
          <div className="w-12 h-0.5 bg-gray-200 mx-auto mb-6"></div>
          <p className="text-lg text-[var(--grey-dark)] max-w-xl mx-auto">
            ببینە نووسەران و خوێنەرانی بنووسا چی دەڵێن
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Ultra Clean Testimonial Display */}
          <div className="relative">
            {/* Testimonial Cards */}
            <div className="bg-white">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={testimonial.id}
                  className={`transition-all duration-800 ease-in-out ${
                    activeIndex === index 
                      ? 'opacity-100 translate-y-0 scale-100 block' 
                      : 'opacity-0 translate-y-4 scale-95 hidden'
                  }`}
                >
                  <div className="px-4 py-6">
                    <div className="flex justify-center mb-8 relative">
                      <div className="w-20 h-20 rounded-full overflow-hidden shadow-sm">
                        <Image
                          src="/images/placeholders/avatar-primary.png"
                          alt={testimonial.name}
                          width={80}
                          height={80}
                          className="object-cover"
                        />
                      </div>
                      {/* Subtle star icon */}
                      <div className="absolute -top-1 -right-1 text-blue-400 opacity-20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
                        </svg>
                      </div>
                    </div>
                    
                    <blockquote className="text-center relative mb-8">
                      {/* Blue Quote Mark - Top */}
                      <span className="text-blue-500 text-6xl absolute top-0 right-0 -mt-8 -mr-2 leading-none opacity-15">"</span>
                      
                      <p className="text-[var(--grey-dark)] text-lg leading-relaxed px-8 md:px-12">
                        {testimonial.quote}
                      </p>
                      
                      {/* Blue Quote Mark - Bottom */}
                      <span className="text-blue-500 text-6xl absolute bottom-0 left-0 -mb-16 -ml-2 leading-none opacity-15">"</span>
                      
                      {/* Subtle heart icon */}
                      <div className="absolute bottom-2 right-2 text-blue-400 opacity-10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 4.248c-3.148-5.402-12-3.825-12 2.944 0 4.661 5.571 9.427 12 15.808 6.43-6.381 12-11.147 12-15.808 0-6.792-8.875-8.306-12-2.944z"/>
                        </svg>
                      </div>
                    </blockquote>
                    
                    <div className="text-center">
                      <h3 className="font-semibold text-xl">{testimonial.name}</h3>
                      <p className="text-sm text-[var(--grey)] flex items-center justify-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Minimal Navigation Controls */}
            <div className="flex justify-center items-center mt-8 gap-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  disabled={isTransitioning}
                  className={`w-2 h-2 rounded-full transition-all duration-500 ${
                    activeIndex === index 
                      ? 'bg-blue-500 w-6' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
            
            {/* Subtle Navigation Arrows */}
            <button 
              onClick={goToPrevSlide}
              disabled={isTransitioning}
              className="absolute top-1/2 left-0 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-blue-500 transition-all duration-300 disabled:opacity-30"
              aria-label="Previous testimonial"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button 
              onClick={goToNextSlide}
              disabled={isTransitioning}
              className="absolute top-1/2 right-0 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-blue-500 transition-all duration-300 disabled:opacity-30"
              aria-label="Next testimonial"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials; 