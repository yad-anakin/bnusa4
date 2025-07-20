'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * PWAWrapper component handles the PWA installation prompts and stores
 * the deferredPrompt event for later use by install buttons
 */
const PWAWrapper = () => {
  const pathname = usePathname();
  
  useEffect(() => {
    // Store the beforeinstallprompt event so it can be triggered later
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Store the event so it can be triggered later
      (window as any).deferredPrompt = e;
    };
    
    // When the PWA is successfully installed
    const handleAppInstalled = () => {
      // Clear the deferredPrompt variable
      (window as any).deferredPrompt = null;
    };
    
    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);
  
  return null; // This component doesn't render anything
};

export default PWAWrapper; 