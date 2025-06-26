import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-[var(--grey-light)] py-12">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="text-2xl font-bold text-[var(--primary)]">
            بنووسە
            </Link>
            <p className="mt-4 text-[var(--grey-dark)] max-w-xs">
            پلاتفۆرمێک بۆ نووسین و بڵاوکردنەوە بە زمانی کوردی  لە بوارە جیاوازەکان.
            </p>
            <div className="mt-6 flex space-x-4 rtl:space-x-reverse">
              <a href="https://www.instagram.com/bnusa_net?igsh=Z2VmNGZlend4M242" target="_blank" rel="noopener noreferrer" className="text-[var(--grey-dark)] hover:text-[var(--primary)] transition-colors duration-200">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a href="https://t.me/bnusa_net" target="_blank" rel="noopener noreferrer" className="text-[var(--grey-dark)] hover:text-[var(--primary)] transition-colors duration-200">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold text-[var(--grey-dark)]">بەستەرە خێراکان</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/" className="text-[var(--grey)] hover:text-[var(--primary)]">
                  سەرەکی
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-[var(--grey)] hover:text-[var(--primary)]">
                  دەربارەی ئێمە
                </Link>
              </li>
              <li>
                <Link href="/writers" className="text-[var(--grey)] hover:text-[var(--primary)]">
                  ستاف
                </Link>
              </li>
              <li>
                <Link href="/write-here" className="text-[var(--grey)] hover:text-[var(--primary)]">
                  لێرە بنووسە
                </Link>
              </li>
              <li>
                <Link href="/terms-of-use" className="text-[var(--grey)] hover:text-[var(--primary)]">
                  مەرجەکانی بەکارهێنان و ناوەڕۆک
                </Link>
              </li>
              <li>
                <Link href="/pwa-guide" className="text-[var(--grey)] hover:text-[var(--primary)]">
                  زیادکردنی وێب ئەپی بنووسە
                </Link>
              </li>
            </ul>
          </div>

          {/* Bnusa Content */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold text-[var(--grey-dark)]">ناوەڕۆکی بنووسە</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/bookstore" className="text-[var(--grey)] hover:text-[var(--primary)]">
                  کتێبخانەی بنووسە
                </Link>
              </li>
              <li>
                <Link href="/publishes" className="text-[var(--grey)] hover:text-[var(--primary)]">
                  بڵاوكراوەكان
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--grey-light)]">
          <div className="flex justify-center items-center">
            <p className="text-[var(--grey)]">
              &copy; 2025 بنووسە. هەموو مافەکان پارێزراون.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 