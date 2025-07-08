import React from 'react';

const TermsOfUse = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-[var(--primary)] mb-8">مەرجەکانی بەکارهێنان و ناوەڕۆک</h1>
      
      <div className="prose max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">دەربارەی پلاتفۆرمی بنووسە</h2>
          <p className="mb-4">
            پلاتفۆرمی بنووسە پلاتفۆرمێکە بۆ بەشداریکردنی نووسەران و خوێنەران بە زمانی کوردی. ئێمە دەستەواژەیەکمان دروست کردووە کە هەموو کەسێک دەتوانێت بەشداری تێدا بکات و بەرهەمەکانی خۆی بڵاو بکاتەوە.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">بەشداریکردن و بڵاوکردنەوە</h2>
          <p className="mb-4">
            هەر بەکارهێنەرێک دەتوانێت:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>هەژماری خۆی دروست بکات</li>
            <li>نووسینەکانی خۆی پۆست بکات</li>
            <li>بەرهەمەکانی خۆی بە ناوی خۆی بڵاو بکاتەوە</li>
            <li>کتێبەکانی خۆی لە ڕێگەی کۆمەڵە کۆمەڵایەتییەکانمان بۆمان بنێرێت بۆ بڵاوکردنەوە</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">مافی بەرهەمەکان</h2>
          <p className="mb-4">
            هەموو بەرهەمێک کە لە پلاتفۆرمی بنووسە بڵاو دەکرێتەوە، خۆی خاوەنییەتی. ئێمە تەنها وەک پلاتفۆرمێک کار دەکەین بۆ:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>بەرهەمەکان بۆ بازرگانیکردن بەکاربهێنین</li>
            <li>بەرهەمەکان بەناوبانگ بکەین</li>
            <li>ڕۆشنبیری و خوێندنەوە بەرەوپێش ببەین</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">کتێبخانەی ئۆنلاین</h2>
          <p className="mb-4">
            هەموو کتێبێک کە لە کتێبخانەی ئۆنلاینی بنووسە بڵاو دەکرێتەوە، پێشووتر وەرگیراوە. ئێمە:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>کتێبەکانمان بۆ PDF ناکەین</li>
            <li>کتێبەکانمان لەتۆڕە کۆمەڵایەتییەکان وەردەگرین</li>
            <li>تەنها وەک پلاتفۆرمێک کار دەکەین بۆ کۆکردنەوەی بەرهەمەکان بۆ باشترکردنی ڕۆشنبیری</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">پەیوەندی</h2>
          <p className="mb-4">
            ئەگەر پرسیارێکت هەیە یان پێشنیارێکت هەیە، تکایە لە ڕێگەی کۆمەڵە کۆمەڵایەتییەکانمان پەیوەندی پێوە بگرە.
          </p>
          <li>گەر بەرهەمێکت یاخوود کتێبێکت بە بێ پرسی تۆ وەک نووسەر بڵاوکراوەتەوە، پەیوەندی بکە بۆ لابردنی.</li>
        </section>
      </div>
    </div>
  );
};

export default TermsOfUse; 