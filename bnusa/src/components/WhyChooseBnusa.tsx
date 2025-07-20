'use client';

import React from 'react';
import Image from 'next/image';
import { useTheme } from '@/utils/themeContext';
import { motion } from 'framer-motion';

const WhyChooseBnusa = () => {
  const { reduceMotion } = useTheme();

  const reasons = [
    {
      id: 1,
      title: 'زمانی ستاندارد',
      description: 'پشتگیری لە ڕێنووسی یەکگرتووی کوردی و زمانی ستاندارد دەکەین بۆ باشترکردنی ئەزموونی خوێندنەوە.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M5 7l8 10m-8 0l8 -10m1 7h3m3 0h-3m3 -3v6" />
        </svg>
      ),
      gradient: 'from-blue-50 to-indigo-50'
    },
    {
      id: 2,
      title: 'پشتگیری هەموو ئامێرەکان دەکات',
      description: 'بنووسە لەسەر هەموو ئامێرەکان بەباشی کار دەکات، لە مۆبایل و تابلێت تاکوو کۆمپیوتەر.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M3 5a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-10z" />
          <path d="M7 20h10" />
          <path d="M9 16v4" />
          <path d="M15 16v4" />
        </svg>
      ),
      gradient: 'from-purple-50 to-pink-50'
    },
    {
      id: 3,
      title: 'هاندانی نووسەران',
      description: 'سیستەمی پێدانی خەڵات و ڕێزلێنان لە نووسەران، هاندانیان بۆ بەردەوامبوون لە نووسین.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M12 5l0 14" />
          <path d="M5 12l14 0" />
        </svg>
      ),
      gradient: 'from-amber-50 to-yellow-50'
    },
    {
      id: 4,
      title: 'نووسینی هاوبەش',
      description: 'دەتوانن بە شێوەی گرووپ و هاوبەش کار لەسەر وتار و بابەتە جیاوازەکان بکەن.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
          <path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
          <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
        </svg>
      ),
      gradient: 'from-emerald-50 to-teal-50'
    },
  ];

  // Custom variants for animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 50,
        damping: 10,
        duration: 0.5
      }
    }
  };

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 inset-0 pointer-events-none">
        <div className="absolute top-20 right-0 transform -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-[var(--primary-light)]/30 to-[var(--primary)]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-0 transform translate-y-1/2 w-72 h-72 bg-gradient-to-tr from-[var(--primary)]/10 to-[var(--primary-light)]/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">بۆچی بنووسە هەڵبژێریت؟</h2>
          <p className="text-lg text-[var(--grey-dark)]">
            بنووسە خزمەتگوزاریەکی تایبەتە بۆ نووسین و بڵاوکردنەوەی بابەت و وتار بە زمانی کوردی، کە چەندین تایبەتمەندی بەهێزی هەیە.
          </p>
        </div>

        {reduceMotion ? (
          // Non-animated version
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reasons.map((reason) => (
              <div 
                key={reason.id} 
                className={`bg-gradient-to-br ${reason.gradient} p-8 rounded-2xl transition-all`}
              >
                <div className="text-[var(--primary)] mb-6">{reason.icon}</div>
                <h3 className="text-xl font-bold mb-3">{reason.title}</h3>
                <p className="text-[var(--grey-dark)]">{reason.description}</p>
              </div>
            ))}
          </div>
        ) : (
          // Animated version with framer-motion
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
          >
            {reasons.map((reason) => (
              <motion.div 
                key={reason.id} 
                className={`bg-gradient-to-br ${reason.gradient} p-8 rounded-2xl transition-all`}
                variants={itemVariants}
                whileHover={{ 
                  y: -5,
                  transition: { duration: 0.2 }
                }}
              >
                <div className="text-[var(--primary)] mb-6">{reason.icon}</div>
                <h3 className="text-xl font-bold mb-3">{reason.title}</h3>
                <p className="text-[var(--grey-dark)]">{reason.description}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default WhyChooseBnusa; 