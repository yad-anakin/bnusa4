import Link from 'next/link';

export default function NotFound({ message = "ئەم وتارە یان کتێبە بوونی نییە" }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center bg-gradient-to-br from-white via-[var(--primary)]/10 to-[var(--secondary)]/10 px-4 py-16 border border-[var(--primary)]/10 rounded-2xl">
      {/* Big 404 Illustration */}
      <div className="mb-8">
        <svg className="w-28 h-28 text-[var(--primary)] mx-auto" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="56" fill="#fff" stroke="currentColor" strokeWidth="6"/>
          <text x="60" y="78" textAnchor="middle" fontSize="48" fill="currentColor" fontWeight="bold" fontFamily="inherit">404</text>
        </svg>
      </div>
      <h1 className="text-4xl font-extrabold text-[var(--primary)] mb-3">پەڕە نەدۆزرایەوە</h1>
      <p className="text-lg text-gray-600 mb-10">{message}</p>
      <Link
        href="/"
        className="inline-block px-8 py-3 bg-[var(--primary)] text-white rounded-full font-bold text-lg hover:bg-[var(--primary-dark)] transition-colors duration-200"
      >
        گەڕانەوە بۆ پەڕەی سەرەکی
      </Link>
    </div>
  );
} 