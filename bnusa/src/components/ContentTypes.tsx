// This component is now unused. The home page uses BnusaWriteOptions instead. Safe to delete if not used elsewhere.
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/utils/themeContext';
import { motion } from 'framer-motion';
import api from '@/utils/api';

// Define types for the content type data from the API
type ContentType = {
  id: string;
  title: string;
  description: string;
  gradient: string;
  iconPath: string;
  iconStrokeWidth: number;
  order: number;
};

const ContentTypes = () => {
  const { reduceMotion } = useTheme();
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContentTypes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await api.get('/api/content-types');
        
        if (data.success) {
          setContentTypes(data.contentTypes);
        } else {
          throw new Error(data.error || 'Failed to fetch content types');
        }
      } catch (err) {
        console.error('Error fetching content types:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchContentTypes();
  }, []);

  // Custom variants for animations with enhanced smoothness
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.15,
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

  // Decorative icons for background
  const DecorativeIcons = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-20 right-10 text-blue-100 opacity-5 transform rotate-12">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      </div>
      <div className="absolute bottom-40 left-10 text-purple-100 opacity-5 transform -rotate-12">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-40 w-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
    </div>
  );

  // Render the icon based on the path from the database
  const renderIcon = (iconPath: string, strokeWidth: number = 1.5) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      className="w-10 h-10" 
      viewBox="0 0 24 24" 
      strokeWidth={strokeWidth} 
      stroke="currentColor" 
      fill="none" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d={iconPath} />
    </svg>
  );

  // Loading state
  if (loading) {
    return (
      <section className="py-24 relative overflow-hidden bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
            <p className="mt-4 text-lg text-[var(--grey-dark)]">جاوەڕێ بکە...</p>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="py-24 relative overflow-hidden bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                <path d="M12 9v4" />
                <path d="M12 16v.01" />
              </svg>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">هەڵەیەک ڕوویدا</h2>
            <p className="text-lg text-[var(--grey-dark)]">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-6 bg-[var(--primary)] text-white px-6 py-2 rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
            >
              هەوڵی دووبارە بدە
            </button>
          </div>
        </div>
      </section>
    );
  }

  // No content types found
  if (contentTypes.length === 0) {
    return (
      <section className="py-24 relative overflow-hidden bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">لە بنووسە چی دەنووسیت؟</h2>
            <p className="text-lg text-[var(--grey-dark)]">
              هیچ جۆرێکی ناوەڕۆک نەدۆزرایەوە.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 relative overflow-hidden bg-white">
      {/* Background decorative elements */}
      <div className="absolute top-0 inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--primary-light)]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[var(--primary)]/3 rounded-full blur-3xl"></div>
      </div>
      
      <DecorativeIcons />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">لە بنووسە چی دەنووسیت؟</h2>
          <p className="text-lg text-[var(--grey-dark)]">
            چەندین جۆری جیاواز لە ناوەڕۆک دەتوانیت لە بنووسە بڵاو بکەیتەوە، هەر لە وتاری درێژ تا شیعر و هۆنراوە
          </p>
        </div>

        {reduceMotion ? (
          // Non-animated version
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {contentTypes.map((type) => (
              <Link 
                href="/publishes" 
                key={type.id} 
                className={`bg-gradient-to-br ${type.gradient} p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow`}
              >
                <div className="text-[var(--primary)] mb-6">
                  {renderIcon(type.iconPath, type.iconStrokeWidth)}
                </div>
                <h3 className="text-xl font-bold mb-3">{type.title}</h3>
                <p className="text-[var(--grey-dark)]">{type.description}</p>
              </Link>
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
            {contentTypes.map((type) => (
              <motion.div 
                key={type.id} 
                className={`bg-gradient-to-br ${type.gradient} p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all`}
                variants={itemVariants}
                whileHover={{ 
                  y: -5,
                  transition: { duration: 0.2 }
                }}
              >
                <Link href="/publishes" className="block h-full">
                  <div className="text-[var(--primary)] mb-6">
                    {renderIcon(type.iconPath, type.iconStrokeWidth)}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{type.title}</h3>
                  <p className="text-[var(--grey-dark)]">{type.description}</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default ContentTypes; 