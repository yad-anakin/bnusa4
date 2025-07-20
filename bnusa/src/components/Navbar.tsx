'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/utils/themeContext';
import { useAuth } from '@/contexts/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [visible, setVisible] = useState(true);
  const { reduceMotion } = useTheme();
  const { currentUser, loading } = useAuth();

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Update scrolled state based on scroll position
      if (currentScrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
      
      // Hide navbar when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 200) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Toggle mobile menu and prevent background scrolling when menu is open
  const toggleMenu = () => {
    const newState = !isMenuOpen;
    setIsMenuOpen(newState);
    
    if (newState) {
      // Lock scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Release scroll lock
      document.body.style.overflow = '';
    }
  };

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const transitionStyle = reduceMotion ? {} : {
    transition: 'transform 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease'
  };

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 w-full font-[Rabar_021] ${
          scrolled 
            ? 'bg-white/80 backdrop-blur-md' 
            : 'bg-transparent backdrop-blur-sm'
        } ${
          visible 
            ? 'translate-y-0' 
            : '-translate-y-full'
        }`}
        style={transitionStyle}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-24">
            {/* Logo */}
            <Link 
              href="/" 
              className="text-2xl font-bold text-[var(--primary)] transition-colors"
            >
              بنووسە
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden min-[800px]:flex items-center space-x-8">
              <Link 
                href="/" 
                className="text-[var(--foreground)] hover:text-[var(--primary)] transition-colors px-2 py-1 font-medium"
              >
                سەرەکی
              </Link>
              <Link 
                href="/about" 
                className="text-[var(--foreground)] hover:text-[var(--primary)] transition-colors px-2 py-1 font-medium"
              >
                دەربارە
              </Link>
              <Link 
                href="/publishes" 
                className="text-[var(--foreground)] hover:text-[var(--primary)] transition-colors px-2 py-1 font-medium"
              >
                بڵاوکراوەکان
              </Link>
              <Link 
                href="/bookstore" 
                className="text-[var(--foreground)] hover:text-[var(--primary)] transition-colors px-2 py-1 font-medium"
              >
                کتێبخانە
              </Link>
              <Link 
                href="/writers" 
                className="text-[var(--foreground)] hover:text-[var(--primary)] transition-colors px-2 py-1 font-medium"
              >
                ستاف
              </Link>
              <Link 
                href="/write-here" 
                className="text-[var(--foreground)] hover:text-[var(--primary)] transition-colors px-2 py-1 font-medium"
              >
                لێرە بنووسە
              </Link>
              
            </nav>

            {/* Search and Account (Desktop) */}
            <div className="hidden max-[1px]:flex items-center space-x-4">
              {/* Authentication/Profile Links */}
              {loading ? (
                // Loading state
                <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin"></div>
              ) : currentUser ? (
                // Authenticated user
                <div className="flex items-center space-x-3">
                  <Link 
                    href="/profile"
                    className="p-2 rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary-light)] transition-colors hover:scale-105 duration-300"
                    title="پرۆفایل"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                  <Link 
                    href="/settings"
                    className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors hover:scale-105 duration-300"
                    title="ڕێکخستنەکان"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </Link>
                </div>
              ) : (
                // Not authenticated
                <div className="flex items-center">
                  <Link 
                    href="/signin"
                    className="px-3 py-1.5 rounded-md text-[var(--primary)] border border-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors duration-200 text-sm font-medium"
                  >
                    چوونە ژوورەوە
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="block max-[1px]:hidden p-2 focus:outline-none z-50"
              onClick={toggleMenu}
              aria-label={isMenuOpen ? 'داخستنی مینیۆ' : 'کردنەوەی مینیۆ'}
              aria-expanded={isMenuOpen}
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu - Full Screen Overlay */}
      <div 
        className={`fixed inset-0 bg-white/90 backdrop-blur-md z-40 flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ paddingTop: '96px' }}
      >
        <div className="container mx-auto px-4 flex-1 flex flex-col justify-between py-8">
          {/* Navigation Links in Middle */}
          <nav className="flex-1 flex flex-col space-y-8 mb-10">
            <Link
              href="/"
              className="text-2xl font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
              onClick={toggleMenu}
            >
              سەرەکی
            </Link>
            <Link
              href="/about"
              className="text-2xl font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
              onClick={toggleMenu}
            >
              دەربارەی ئێمە
            </Link>
            <Link
              href="/publishes"
              className="text-2xl font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
              onClick={toggleMenu}
            >
              بڵاوکراوەکان
            </Link>
            <Link
              href="/bookstore"
              className="text-2xl font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
              onClick={toggleMenu}
            >
              کتێبخانە
            </Link>
            <Link
              href="/writers"
              className="text-2xl font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
              onClick={toggleMenu}
            >
              ستاف
            </Link>
            <Link
              href="/write-here"
              className="text-2xl font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
              onClick={toggleMenu}
            >
              لێرە بنووسە
            </Link>
            <Link
              href="/terms-of-use"
              className="text-2xl font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
              onClick={toggleMenu}
            >
              مەرجەکانی بەکارهێنان و ناوەڕۆک
            </Link>
            <Link
              href="/pwa-guide"
              className="text-2xl font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
              onClick={toggleMenu}
            >
              زیادکردنی وێب ئەپی بنووسە
            </Link>
          </nav>

          {/* Account Section at Bottom */}
          <div className="mt-auto">
            {loading ? (
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin"></div>
              </div>
            ) : currentUser ? (
              <>
                <Link href="/profile" onClick={toggleMenu} className="block">
                  <div className="p-4 bg-[var(--grey-light)]/30 rounded-lg flex items-center space-x-4 hover:bg-[var(--grey-light)]/50 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                      {currentUser.photoURL ? (
                        <img 
                          src={currentUser.photoURL}
                          alt={currentUser.displayName || 'User'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{currentUser.displayName || 'User'}</p>
                      <p className="text-sm text-[var(--grey)]">بینینی پڕۆفایل</p>
                    </div>
                  </div>
                </Link>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link href="/settings" onClick={toggleMenu} className="block">
                    <button className="w-full py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors rounded-lg flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      ڕێکخستنەکان
                    </button>
                  </Link>
                  <Link href="/dashboard" onClick={toggleMenu} className="block">
                    <button className="w-full py-3 bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors rounded-lg flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      داشبۆرد
                    </button>
                  </Link>
                </div>
                <div className="mt-4">
                  {/* LogoutButton removed */}
                </div>
              </>
            ) : (
              <>
                <div className="p-4 bg-[var(--grey-light)]/30 rounded-lg flex items-center space-x-4 hover:bg-[var(--grey-light)]/50 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-[var(--foreground)]">ژمارەی کەسی</p>
                    <p className="text-sm text-[var(--grey)]">بینینی پڕۆفایل</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Link href="/signin" onClick={toggleMenu} className="block w-full">
                    <button className="w-full py-3 bg-white border border-[var(--primary)] text-[var(--primary)] rounded-lg hover:bg-[var(--primary-light)]/10 transition-colors">
                      چوونە ژوورەوە
                    </button>
                  </Link>
                  <Link href="/signup" onClick={toggleMenu} className="block w-full">
                    <button className="w-full py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-light)] transition-colors">
                      تۆمارکردن
                    </button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar; 