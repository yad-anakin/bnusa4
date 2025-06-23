'use client';

import React from 'react';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import ProfileManager from '../../components/auth/ProfileManager';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';

export default function DashboardPage() {
  const { currentUser } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-[var(--primary-light)]/5 to-[var(--secondary-light)]/5 py-12 px-4 sm:px-6 lg:px-8 font-rabar">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-[var(--primary)]">داشبۆرد</h1>
            <p className="text-[var(--grey-dark)]">
              بەخێربێیت {currentUser?.displayName || 'بۆ هەژمارەکەت'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="p-6">
              <ProfileManager />
            </div>
          </div>

          {/* Dashboard sections */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-[var(--primary)] text-right">چالاکییەکانت</h2>
              <p className="text-[var(--grey-dark)] text-right">هیچ چالاکییەکی نوێت نییە.</p>
              
              <div className="mt-4 flex justify-end">
                <Link href="/write-here" className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors text-sm font-medium">
                  دەستپێکردنی نووسین &rarr;
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-[var(--primary)] text-right">بابەتە هەڵگیراوەکان</h2>
              <p className="text-[var(--grey-dark)] text-right">تا ئێستا هیچ بابەتێکت هەڵنەگرتووە.</p>
              
              <div className="mt-4 flex justify-end">
                <Link href="/publishes" className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors text-sm font-medium">
                  گەڕان بۆ بابەتەکان &rarr;
                </Link>
              </div>
            </div>
          </div>
          
          <div className="mt-6 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-[var(--primary)] text-right">ڕێکخستنەکانی هەژمار</h2>
            <div className="flex justify-between items-center flex-wrap gap-4">
              <Link href="/settings" className="bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] py-3 px-5 rounded-lg transition-colors text-sm font-medium">
                گۆڕینی ڕێکخستنەکان
              </Link>
              
              <Link 
                href={`/profile?refresh=${Date.now()}`} 
                className="bg-[var(--grey-light)]/50 hover:bg-[var(--grey-light)] text-[var(--grey-dark)] py-3 px-5 rounded-lg transition-colors text-sm font-medium"
              >
                بینینی پرۆفایل
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 