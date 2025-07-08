'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PWAWrapper from '../../components/PWAWrapper';

export default function PWAGuidePage() {
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android');

  return (
    <>
      <PWAWrapper />
    <div className="container mx-auto px-4 py-16 mt-16">
      <h1 className="text-3xl font-bold text-center mb-8">زیادکردنی ئەپی بنووسە</h1>
      
      {/* App Icon Display */}
      <div className="flex justify-center mb-8">
        <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-lg border-2 border-[var(--primary)] flex items-center justify-center bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)]">
          <span className="text-white text-4xl font-bold"><img src="icons/icon-192x192.png" alt="" /></span>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              activeTab === 'android' 
                ? 'bg-[var(--primary)] text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-200 flex items-center gap-2`}
            onClick={() => setActiveTab('android')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 1.23 12.95 1 12 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 3.26 6 5.01 6 7h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z"/>
            </svg>
            ئەندرۆید
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'ios' 
                ? 'bg-[var(--primary)] text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border-t border-b border-gray-200 flex items-center gap-2`}
            onClick={() => setActiveTab('ios')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 50 50" fill="currentColor">
              <path d="M 44.527344 34.75 C 43.449219 37.144531 42.929688 38.214844 41.542969 40.328125 C 39.601563 43.28125 36.863281 46.96875 33.480469 46.992188 C 30.46875 47.019531 29.691406 45.027344 25.601563 45.0625 C 21.515625 45.082031 20.664063 47.03125 17.648438 47 C 14.261719 46.96875 11.671875 43.648438 9.730469 40.699219 C 4.300781 32.429688 3.726563 22.734375 7.082031 17.578125 C 9.457031 13.921875 13.210938 11.773438 16.738281 11.773438 C 20.332031 11.773438 22.589844 13.746094 25.558594 13.746094 C 28.441406 13.746094 30.195313 11.769531 34.351563 11.769531 C 37.492188 11.769531 40.8125 13.480469 43.1875 16.433594 C 35.421875 20.691406 36.683594 31.78125 44.527344 34.75 Z M 31.195313 8.46875 C 32.707031 6.527344 33.855469 3.789063 33.4375 1 C 30.972656 1.167969 28.089844 2.742188 26.40625 4.78125 C 24.878906 6.640625 23.613281 9.398438 24.105469 12.066406 C 26.796875 12.152344 29.582031 10.546875 31.195313 8.46875 Z"/>
            </svg>
            iOS
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              activeTab === 'desktop' 
                ? 'bg-[var(--primary)] text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border border-gray-200 flex items-center gap-2`}
            onClick={() => setActiveTab('desktop')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z"/>
            </svg>
            کۆمپیوتەر
          </button>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        {activeTab === 'android' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">زیادکردنی ئەپەکە لەسەر ئەندرۆید</h2>
            
            <div className="border-r-4 border-[var(--primary)] pr-4 py-2 bg-gray-50">
              <p className="text-lg">ڕێگای ئاسان و خێرا بۆ دەستگەیشتن بە ئەپی بنووسە لەسەر مۆبایلی ئەندرۆید</p>
            </div>
            
            {/* Download Prompt Banner for Android */}
            <div className="bg-[var(--primary)]/10 p-4 rounded-lg mb-6 flex items-center gap-4">
              <div className="flex-shrink-0 bg-[var(--primary)] text-white p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l4 4h-3v9h-2V6H8l4-4z"/>
                  <path d="M19 7h-2v12H7V7H5v14h14V7z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-[var(--primary)]">دابەزاندنی ئەپەکە</h3>
                <p className="text-gray-700">هەر ئێستا ئەپی بنووسە دابەزێنە بۆ ئەندرۆید بۆ بەکارهێنانی خێراتر و باشتر</p>
              </div>
              <button 
                className="mr-auto bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white px-4 py-2 rounded-lg transition-colors"
                onClick={() => {
                  const deferredPrompt = (window as any).deferredPrompt;
                  if (deferredPrompt) {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult: any) => {
                      if (choiceResult.outcome === 'accepted') {
                      }
                      (window as any).deferredPrompt = null;
                    });
                  }
                }}
              >
                دابەزاندن
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-[var(--primary)] text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">1</div>
                  <div>
                    <h3 className="font-medium">کردنەوەی ماڵپەڕی بنووسە لە براوزەری کرۆم</h3>
                    <p className="text-gray-600 mt-1">سەردانی bnusa.com بکە لە براوزەری کرۆم لەسەر مۆبایلەکەت</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-[var(--primary)] text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">2</div>
                  <div>
                    <h3 className="font-medium">کردنەوەی مینیۆی براوزەرەکە</h3>
                    <p className="text-gray-600 mt-1">کرتە لەسەر ئایکۆنی سێ خاڵ لە گۆشەی سەرەوەی ڕاستەوە بکە</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-[var(--primary)] text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">3</div>
                  <div>
                    <h3 className="font-medium">کرتە لەسەر "زیادکردن بۆ هۆم سکرین" بکە</h3>
                    <p className="text-gray-600 mt-1">لە مینیۆی براوزەرەکەدا، بژاردەی "زیادکردن بۆ هۆم سکرین" یان "Add to Home Screen" هەڵبژێرە</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-[var(--primary)] text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">4</div>
                  <div>
                    <h3 className="font-medium">پەسەندکردنی زیادکردنەکە</h3>
                    <p className="text-gray-600 mt-1">کرتە لەسەر "زیادکردن" یان "Add" بکە لە پەنجەرەی داواکارییەکە</p>
                  </div>
                </div>
              </div>
              
              <div className="relative h-[500px] rounded-lg overflow-hidden shadow-md border border-gray-200 bg-gray-50 flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="w-20 h-36 border-4 border-gray-300 rounded-xl mx-auto mb-4 relative overflow-hidden bg-white">
                    <div className="absolute top-0 left-0 right-0 h-4 bg-gray-300"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-6 bg-gray-300 flex items-center justify-center">
                      <div className="w-10 h-1 bg-gray-400 rounded-full"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[var(--primary)]" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-500 font-medium">کرتە لەسەر + بکە بۆ زیادکردنی ئەپەکە</p>
                  <p className="text-gray-400 text-sm mt-2">بۆ بینینی باشتر، دابەزاندنی ئەپەکە تاقی بکەرەوە</p>
                </div>
              </div>
            </div>
            
            <div className="bg-[var(--primary)]/10 p-4 rounded-lg">
              <p className="font-medium">ئێستا ئەپی بنووسە لەسەر شاشەی سەرەکیت دەردەکەوێت و دەتوانیت وەک ئەپێکی ئاسایی بەکاری بهێنیت!</p>
            </div>
          </div>
        )}

        {activeTab === 'ios' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">زیادکردنی ئەپەکە لەسەر iOS</h2>
            
            <div className="border-r-4 border-[var(--primary)] pr-4 py-2 bg-gray-50">
              <p className="text-lg">ڕێگای زیادکردنی بنووسە وەک ئەپ لەسەر ئایفۆن و ئایپاد</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-[var(--primary)] text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">1</div>
                  <div>
                    <h3 className="font-medium">کردنەوەی ماڵپەڕی بنووسە لە براوزەری سەفاری</h3>
                    <p className="text-gray-600 mt-1">سەردانی bnusa.com بکە لە براوزەری سەفاری لەسەر ئامێری iOS ـەکەت</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-[var(--primary)] text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">2</div>
                  <div>
                    <h3 className="font-medium">کرتە لەسەر ئایکۆنی "هاوبەشکردن" بکە</h3>
                    <p className="text-gray-600 mt-1">ئایکۆنی هاوبەشکردن (Share) لە خوارەوە یان سەرەوەی براوزەرەکە دۆزەرەوە</p>
                    <div className="mt-2 rounded-lg p-2 bg-gray-100">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-500">
                        <path d="M12 2l4 4h-3v9h-2V6H8l4-4z"/>
                        <path d="M19 7h-2v12H7V7H5v14h14V7z"/>
                      </svg>
                      <p className="text-gray-500 text-xs mt-1">ئایکۆنی هاوبەشکردن لە iOS</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-[var(--primary)] text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">3</div>
                  <div>
                    <h3 className="font-medium">کرتە لەسەر "زیادکردن بۆ هۆم سکرین" بکە</h3>
                    <p className="text-gray-600 mt-1">لە خشتەی هەڵبژاردنەکان، بەدوای "زیادکردن بۆ هۆم سکرین" یان "Add to Home Screen" بگەڕێ</p>
                    <div className="mt-2 rounded-lg p-2 bg-gray-100">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-500">
                        <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                        <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                      </svg>
                      <p className="text-gray-500 text-xs mt-1">ئایکۆنی "زیادکردن بۆ هۆم سکرین"</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-[var(--primary)] text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">4</div>
                  <div>
                    <h3 className="font-medium">پەسەندکردنی زیادکردنەکە</h3>
                    <p className="text-gray-600 mt-1">دەتوانیت ناوی ئەپەکە بگۆڕیت یان وەک خۆی بیهێڵیتەوە، پاشان کرتە لەسەر "زیادکردن" یان "Add" لە گۆشەی سەرەوەی ڕاستەوە بکە</p>
                  </div>
                </div>
              </div>
              
              <div className="relative h-[500px] rounded-lg overflow-hidden shadow-md border border-gray-200 bg-gray-50 flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="w-20 h-36 border-4 border-gray-300 rounded-xl mx-auto mb-4 relative overflow-hidden bg-white">
                    <div className="absolute top-0 left-0 right-0 h-4 bg-gray-300 flex items-center justify-center">
                      <div className="w-6 h-1 bg-gray-400 rounded-full"></div>
                    </div>
                    <div className="flex flex-col h-full pt-6 px-2">
                      <div className="flex items-center mb-2">
                        <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                          </svg>
                        </div>
                        <div className="h-1 w-8 bg-gray-300 ml-1 rounded-full"></div>
                      </div>
                      <div className="mt-auto mb-2 flex justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-500 font-medium">دابەزاندن بۆ شاشەی سەرەکی</p>
                  <p className="text-gray-400 text-sm mt-2">ئایکۆنی هاوبەشکردن → زیادکردن بۆ هۆم سکرین</p>
                </div>
              </div>
            </div>
            
            <div className="bg-[var(--primary)]/10 p-4 rounded-lg mt-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[var(--primary)]">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="font-medium">ئەپی بنووسە ئێستا لەسەر شاشەی سەرەکیت دەردەکەوێت و دەتوانیت بە کرتەکردن لەسەری، وەک ئەپێکی ئاسایی بەکاری بهێنیت!</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'desktop' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">زیادکردنی ئەپەکە لەسەر کۆمپیوتەر</h2>
            
            <div className="border-r-4 border-[var(--primary)] pr-4 py-2 bg-gray-50">
              <p className="text-lg">چۆنیەتی زیادکردنی بنووسە وەک ئەپێکی دێسکتۆپ لەسەر کۆمپیوتەرەکەت</p>
            </div>
            
            {/* Download Prompt Banner for Desktop */}
            <div className="bg-[var(--primary)]/10 p-4 rounded-lg mb-6 flex items-center gap-4">
              <div className="flex-shrink-0 bg-[var(--primary)] text-white p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-[var(--primary)]">دامەزراندنی ئەپەکە</h3>
                <p className="text-gray-700">دامەزراندنی ئەپی بنووسە لەسەر کۆمپیوتەرەکەت بۆ دەستگەیشتنی خێراتر</p>
              </div>
              <button 
                className="mr-auto bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white px-4 py-2 rounded-lg transition-colors"
                onClick={() => {
                  const deferredPrompt = (window as any).deferredPrompt;
                  if (deferredPrompt) {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult: any) => {
                      if (choiceResult.outcome === 'accepted') {
                      }
                      (window as any).deferredPrompt = null;
                    });
                  }
                }}
              >
                دامەزراندن
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-[var(--primary)] text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">1</div>
                  <div>
                    <h3 className="font-medium">کردنەوەی ماڵپەڕی بنووسە لە براوزەری کرۆم</h3>
                    <p className="text-gray-600 mt-1">سەردانی bnusa.com بکە لە براوزەری کرۆم، ئێدج یان هەر براوزەرێکی مۆدێرن کە پشتگیری PWA دەکات</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-[var(--primary)] text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">2</div>
                  <div>
                    <h3 className="font-medium">ئایکۆنی دامەزراندن ببینەوە</h3>
                    <p className="text-gray-600 mt-1">لە شریتی ناونیشانی براوزەرەکەدا، ئایکۆنێکی دامەزراندن دەردەکەوێت (وێنەی + یان دامەزراندن)</p>
                    <div className="mt-2 rounded-lg p-2 bg-gray-100">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-500">
                        <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                      </svg>
                      <p className="text-gray-500 text-xs mt-1">ئایکۆنی دامەزراندن لە شریتی ناونیشان</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-[var(--primary)] text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">3</div>
                  <div>
                    <h3 className="font-medium">کرتە لەسەر ئایکۆنەکە بکە</h3>
                    <p className="text-gray-600 mt-1">کرتە لەسەر ئایکۆنی دامەزراندن بکە، و لە پەنجەرەی پۆپ-ئەپەکەدا "دامەزراندن" یان "Install" هەڵبژێرە</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-[var(--primary)] text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">4</div>
                  <div>
                    <h3 className="font-medium">پەسەندکردنی دامەزراندنەکە</h3>
                    <p className="text-gray-600 mt-1">لە پەنجەرەی دڵنیاکردنەوە، کرتە لەسەر "دامەزراندن" یان "Install" بکە</p>
                  </div>
                </div>
              </div>
              
              <div className="relative h-[400px] rounded-lg overflow-hidden shadow-md border border-gray-200 bg-gray-50 flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="w-64 h-36 border-4 border-gray-300 rounded-lg mx-auto mb-4 relative overflow-hidden bg-white">
                    <div className="absolute top-0 left-0 right-0 h-6 bg-gray-300 flex items-center px-2">
                      <div className="flex space-x-1">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <div className="h-4 w-32 bg-gray-200 mx-auto rounded"></div>
                    </div>
                    <div className="flex justify-center items-center h-full pt-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[var(--primary)]" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-500 font-medium">دامەزراندن لەسەر کۆمپیوتەر</p>
                  <p className="text-gray-400 text-sm mt-2">ئایکۆنی + لە شریتی ناونیشان کلیک بکە</p>
                </div>
              </div>
            </div>
            
            <div className="bg-[var(--primary)]/10 p-4 rounded-lg mt-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[var(--primary)]">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="font-medium">ئەپی بنووسە ئێستا وەک پەنجەرەیەکی سەربەخۆ کراوەتەوە و شۆرتکەتێک لەسەر دێسکتۆپ یان مینیۆی ستارتی کۆمپیوتەرەکەت دروست کراوە!</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-8 text-center">
          <Link href="/">
            <button 
              className="bg-[var(--primary)] text-white px-6 py-2 rounded-lg hover:bg-[var(--primary-light)] transition-colors font-medium"
            >
              گەڕانەوە بۆ ماڵپەڕ
            </button>
          </Link>
        </div>
      </div>
    </div>
    </>
  );
} 