import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('تکایە ئیمەیلەکەت بنووسە');
      setIsSuccess(false);
      return;
    }
    
    try {
      setLoading(true);
      setMessage('');
      await resetPassword(email);
      setIsSuccess(true);
      setMessage('ئیمەیلی گەڕاندنەوەی وشەی نهێنی نێردرا! پشکنینی سندوقی ئیمەیلەکەت بکە');
    } catch (error: any) {
      console.error('هەڵە لە گەڕاندنەوەی وشەی نهێنی:', error);
      setIsSuccess(false);
      setMessage(
        error.code === 'auth/user-not-found'
          ? 'هیچ هەژمارێک نەدۆزرایەوە بەم ئیمەیلە'
          : error.code === 'auth/invalid-email'
          ? 'ئیمەیلی نادروست'
          : 'سەرکەوتوو نەبوو لە ناردنی ئیمەیلی گەڕاندنەوە. تکایە دووبارە هەوڵبدەوە'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {message && (
        <div
          className={`${
            isSuccess ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'
          } px-4 py-3 rounded-lg mb-6 border text-right`}
          role="alert"
        >
          <span className="block sm:inline">{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--grey-dark)] mb-1 text-right">
            ئیمەیل
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-[var(--grey-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-transparent transition-all text-right"
            placeholder="ئیمەیلەکەت بنووسە"
            disabled={loading}
            required
            dir="rtl"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] transition-colors ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'دەنێردرێت...' : 'ناردنی لینکی گەڕاندنەوە'}
          </button>
        </div>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-[var(--grey-dark)]">
          <Link href="/signin" className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors font-medium">
            گەڕانەوە بۆ چوونە ژوورەوە
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordForm; 