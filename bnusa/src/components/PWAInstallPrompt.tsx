'use client';

import React, { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Store the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show our custom install button
      setShowPrompt(true);
    };

    // Check if the user has already installed the app
    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (isAppInstalled) {
      setShowPrompt(false);
      return;
    }

    // Add event listener for 'beforeinstallprompt' event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Get saved preference from localStorage
    const hasUserDismissed = localStorage.getItem('pwa_install_dismissed');
    if (hasUserDismissed === 'true') {
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const choiceResult = await deferredPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
      // Save user preference
      localStorage.setItem('pwa_install_dismissed', 'true');
    }
    
    // We no longer need the prompt, clear it
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    // Save user preference
    localStorage.setItem('pwa_install_dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="pwa-install-prompt">
      <div className="prompt-content">
        <img 
          src="/icons/icon-192x192.png" 
          alt="Bnusa App Icon" 
          className="app-icon"
        />
        <div className="prompt-text">
          <h3>زیادکردنی بنووسە بۆ ڕووکارەکەت</h3>
          <p>دەتوانیت پلاتفۆرمی بنووسە بەئاسانی زیاد بکەیت بۆ ڕووکاری مۆبایلەکەت بۆ دەستگەیشتنی خێراتر</p>
        </div>
        <div className="prompt-actions">
          <button onClick={handleInstallClick} className="install-button">
            زیادی بکە
          </button>
          <button onClick={handleDismiss} className="dismiss-button">
            دواتر
          </button>
        </div>
      </div>

      <style jsx>{`
        .pwa-install-prompt {
          position: fixed;
          bottom: 20px;
          left: 20px;
          right: 20px;
          background: white;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          padding: 16px;
          max-width: 500px;
          margin: 0 auto;
          direction: rtl;
        }
        
        .prompt-content {
          display: flex;
          align-items: center;
        }
        
        .app-icon {
          width: 60px;
          height: 60px;
          margin-left: 16px;
          border-radius: 12px;
        }
        
        .prompt-text {
          flex: 1;
        }
        
        .prompt-text h3 {
          margin: 0 0 4px 0;
          font-size: 16px;
          color: #333;
        }
        
        .prompt-text p {
          margin: 0;
          font-size: 14px;
          color: #666;
        }
        
        .prompt-actions {
          display: flex;
          margin-top: 16px;
          justify-content: flex-end;
        }
        
        .install-button {
          background: #1b65e3;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          margin-left: 8px;
        }
        
        .dismiss-button {
          background: transparent;
          color: #777;
          border: 1px solid #ddd;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
        }
        
        @media (max-width: 600px) {
          .prompt-content {
            flex-direction: column;
            text-align: center;
          }
          
          .app-icon {
            margin: 0 0 12px 0;
          }
        }
      `}</style>
    </div>
  );
};

export default PWAInstallPrompt; 