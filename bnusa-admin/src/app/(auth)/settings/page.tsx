'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import { 
  Cog6ToothIcon, 
  UserCircleIcon, 
  KeyIcon, 
  BellIcon, 
  ShieldCheckIcon, 
  InformationCircleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import { isAuthenticated } from '@/lib/auth';

interface SettingsState {
  general: {
    siteName: string;
    siteDescription: string;
    siteUrl: string;
    contactEmail: string;
  };
  security: {
    twoFactorAuth: boolean;
    passwordExpiration: number; // days
    sessionTimeout: number; // minutes
  };
  notifications: {
    emailNotifications: boolean;
    newArticleNotify: boolean;
    userRegistrationNotify: boolean;
    commentNotify: boolean;
  };
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [settings, setSettings] = useState<SettingsState>({
    general: {
      siteName: 'BNUSA Platform',
      siteDescription: 'News and information platform',
      siteUrl: 'https://bnusa-platform.com',
      contactEmail: 'admin@bnusa-platform.com',
    },
    security: {
      twoFactorAuth: false,
      passwordExpiration: 90,
      sessionTimeout: 30,
    },
    notifications: {
      emailNotifications: true,
      newArticleNotify: true,
      userRegistrationNotify: true,
      commentNotify: false,
    }
  });

  // Double-check authentication on client side
  useLayoutEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    // This would normally fetch from an API
    // For now, we're using the initial state defined above
    setIsLoading(true);
    try {
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 500));
      // In a real implementation, this would fetch actual settings from an API
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch settings', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setMessage(null);
    
    try {
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In a real implementation, this would send the settings to an API
      
      setMessage({ type: 'success', text: 'Settings saved successfully' });
      setIsSaving(false);
    } catch (error) {
      console.error('Failed to save settings', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
      setIsSaving(false);
    }
  };

  const handleInputChange = (section: keyof SettingsState, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="siteName" className="block text-sm font-medium text-gray-700">
                Site Name
              </label>
              <input
                type="text"
                name="siteName"
                id="siteName"
                value={settings.general.siteName}
                onChange={(e) => handleInputChange('general', 'siteName', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700">
                Site Description
              </label>
              <textarea
                rows={3}
                name="siteDescription"
                id="siteDescription"
                value={settings.general.siteDescription}
                onChange={(e) => handleInputChange('general', 'siteDescription', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="siteUrl" className="block text-sm font-medium text-gray-700">
                Site URL
              </label>
              <input
                type="url"
                name="siteUrl"
                id="siteUrl"
                value={settings.general.siteUrl}
                onChange={(e) => handleInputChange('general', 'siteUrl', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                Contact Email
              </label>
              <input
                type="email"
                name="contactEmail"
                id="contactEmail"
                value={settings.general.contactEmail}
                onChange={(e) => handleInputChange('general', 'contactEmail', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        );
      
      case 'security':
        return (
          <div className="space-y-6">
            <div className="flex items-center">
              <input
                id="twoFactorAuth"
                name="twoFactorAuth"
                type="checkbox"
                checked={settings.security.twoFactorAuth}
                onChange={(e) => handleInputChange('security', 'twoFactorAuth', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="twoFactorAuth" className="ml-2 block text-sm text-gray-900">
                Enable Two Factor Authentication
              </label>
            </div>
            
            <div>
              <label htmlFor="passwordExpiration" className="block text-sm font-medium text-gray-700">
                Password Expiration (days)
              </label>
              <input
                type="number"
                name="passwordExpiration"
                id="passwordExpiration"
                min="0"
                value={settings.security.passwordExpiration}
                onChange={(e) => handleInputChange('security', 'passwordExpiration', parseInt(e.target.value))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-700">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                name="sessionTimeout"
                id="sessionTimeout"
                min="1"
                value={settings.security.sessionTimeout}
                onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        );
      
      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="flex items-center">
              <input
                id="emailNotifications"
                name="emailNotifications"
                type="checkbox"
                checked={settings.notifications.emailNotifications}
                onChange={(e) => handleInputChange('notifications', 'emailNotifications', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
                Enable Email Notifications
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="newArticleNotify"
                name="newArticleNotify"
                type="checkbox"
                checked={settings.notifications.newArticleNotify}
                onChange={(e) => handleInputChange('notifications', 'newArticleNotify', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="newArticleNotify" className="ml-2 block text-sm text-gray-900">
                Notify on New Article Submissions
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="userRegistrationNotify"
                name="userRegistrationNotify"
                type="checkbox"
                checked={settings.notifications.userRegistrationNotify}
                onChange={(e) => handleInputChange('notifications', 'userRegistrationNotify', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="userRegistrationNotify" className="ml-2 block text-sm text-gray-900">
                Notify on New User Registrations
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="commentNotify"
                name="commentNotify"
                type="checkbox"
                checked={settings.notifications.commentNotify}
                onChange={(e) => handleInputChange('notifications', 'commentNotify', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="commentNotify" className="ml-2 block text-sm text-gray-900">
                Notify on New Comments
              </label>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your platform settings and configurations</p>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
              ) : (
                <InformationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-md overflow-hidden">
        <div className="sm:flex border-b border-gray-200">
          <div className="sm:w-64 sm:flex-none sm:border-r border-gray-200">
            <nav className="flex flex-col p-4 space-y-1">
              <button
                onClick={() => setActiveTab('general')}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'general'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Cog6ToothIcon className="mr-3 h-5 w-5" />
                General
              </button>
              
              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'security'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <ShieldCheckIcon className="mr-3 h-5 w-5" />
                Security
              </button>
              
              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'notifications'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <BellIcon className="mr-3 h-5 w-5" />
                Notifications
              </button>
            </nav>
          </div>
          
          <div className="p-6 flex-1">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <div>
                {renderTabContent()}
                
                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    onClick={saveSettings}
                    disabled={isSaving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {isSaving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 