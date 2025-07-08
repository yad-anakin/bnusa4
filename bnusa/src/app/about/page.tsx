'use client';

import React from 'react';
import { 
  BookOpenIcon, 
  EyeIcon, 
  UsersIcon, 
  PencilSquareIcon, 
  ArrowRightIcon, 
  DocumentTextIcon, 
  CheckCircleIcon,
  BookmarkIcon,
  UserGroupIcon,
  SparklesIcon,
  PaintBrushIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--primary)]/5 via-white to-[var(--primary)]/10">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--primary)]/5"></div>
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-700 via-blue-500 to-blue-100 bg-clip-text text-transparent">
                دەربارەی بنووسە
              </span>
            </h1>
            <div className="max-w-3xl mx-auto">
              <p className="text-xl text-gray-700 leading-relaxed">
          بنووسە پلاتفۆرمێکی کوردییە کە تایبەتە بە بەشداریکردنی زانیاری و بابەتە هزرییەکان. ئامانجمان درووستکردنی شوێنێکە بۆ نووسەران تا وتار لەسەر زانست، مێژوو، هونەر، و بابەتی دیکە بە زمانی کوردی بڵاو بکەنەوە.
        </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-5xl mx-auto">
          {/* Vision and Mission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 hover:border-[var(--primary)]/20 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <EyeIcon className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold mr-4 text-gray-800">روانگەی ئێمە</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed text-right">
                ئێمە داهاتوویەک دەبینین کە زمانی کوردی و زاراوەکانی بەپێی پێویست وەک نووسراو لە کۆگایەکی دەوڵەمەند و فراوان لە زانیاری کۆکراونەتەوە، کە بەشداری دەکات لە پاراستن و گەشەپێدانی کەلتوور و توانستی هزری کوردی بکات بەشێوەیەکی بەرچاو.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl border border-gray-100 hover:border-[var(--primary)]/20 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="p-4 bg-green-50 rounded-lg">
                  <BookOpenIcon className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mr-4 text-gray-800">ئامانجی ئێمە</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed text-right">
        ئامانجی ئێمە پێشخستنی ئەدەب و گوتاری هزری کوردییە لە رێگەی دابینکردنی پلاتفۆرمێک کە نووسەران بتوانن زانیارییەکانیان بەشداری پێبکەن و خوێنەران بتوانن دەستیان بە ناوەڕۆکی بابەتەکان بگات بە کوالێتی بەرز.
        </p>
            </div>
          </div>
          
          {/* Team */}
          <div className="mb-16">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 hover:border-[var(--primary)]/20 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <UsersIcon className="h-8 w-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold mr-4 text-gray-800">تیمی ئێمە</h2>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed text-right">
                بنووسە لەلایەن تیمێکی دیاریکراو لە نووسەران، ئیدیتەران و پەرەپێدەران بەڕێوە دەبرێت بەشێوەیەکی خۆبەخشانە و قازانج نەویستانە کە ئارەزوومەندی کەلتوور و ئەدەبی کوردین. ئێمە پابەندین بە درووستکردنی پلاتفۆرمێک کە خزمەتی کۆمەڵگەی کوردی بکات، زمانی کوردی و زاراوەکانی وەک زمانی فێربوون زانیاری و بنرخێنێ.
              </p>
            </div>
          </div>

          {/* Become a Writer */}
          <div className="mb-16">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100">
              <div className="flex items-center mb-6">
                <div className="p-4 bg-blue-100 rounded-lg">
                  <PencilSquareIcon className="h-8 w-8 text-blue-700" />
                </div>
                <h2 className="text-2xl font-bold mr-4 text-gray-800">ببە بە نووسەر</h2>
              </div>
              <div className="text-gray-700 text-lg leading-relaxed text-right">
                <p className="mb-4">دەتەوێت بیرۆکە، چیرۆک یان وتارەکانت لە بنووسە بڵاو بکەیتەوە؟</p>
                <p className="mb-6">ئەمە ڕێگەکەیە:</p>
                
                <ol className="space-y-3 mb-6 list-none">
                  <li className="flex items-center">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-base font-semibold">١</span>
                    <span className="mr-6">تۆماربکە یان بچۆ ژوورەوە بۆ هەژمارەکەت لە بنووسە</span>
                  </li>
                  <li className="flex items-center">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-base font-semibold">٢</span>
                    <span className="mr-6">داشبۆردەکەت بکەرەوە و دەست بکە بە نووسینی وتارەکەت</span>
                  </li>
                  <li className="flex items-center">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-base font-semibold">٣</span>
                    <span className="mr-6">وێنە، ڤیدیۆی یوتیوب و لینک زیادبکە ئەگەر دەتەوێت</span>
                  </li>
                  <li className="flex items-center">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-base font-semibold">٤</span>
                    <span className="mr-6">وتارەکەت بنێرە بۆ پێداچوونەوە</span>
                  </li>
                  <li className="flex items-center">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-base font-semibold">٥</span>
                    <span className="mr-6">کاتێک پەسندکرا، لە پڕۆفایلەکەت و لە پەڕەی سەرەکی دەردەکەوێت</span>
                  </li>
                  <li className="flex items-center">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-base font-semibold">٦</span>
                    <span className="mr-6">باجی 🟢 نووسەر وەردەگریت دوای بڵاوکردنەوەی یەکەم وتارت</span>
                  </li>
                </ol>
                
                <div className="flex justify-end mt-6">
                  <Link href="/write-here" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center transition-all duration-200">
                    <span>دەست بکە بە نووسین</span>
                    <ArrowRightIcon className="h-5 w-5 mr-2" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Submit a PDF Book */}
          <div className="mb-16">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-2xl border border-purple-100">
              <div className="flex items-center mb-6">
                <div className="p-4 bg-purple-100 rounded-lg">
                  <DocumentTextIcon className="h-8 w-8 text-purple-700" />
                </div>
                <h2 className="text-2xl font-bold mr-4 text-gray-800">📚 ناردنی کتێبی پی دی ئێف</h2>
              </div>
              <div className="text-gray-700 text-lg leading-relaxed text-right">
                <p className="mb-6">کتێبی کوردیت هەیە (پی دی ئێف) کە دەتەوێت لەگەڵ خەڵک بەشداری پێ بکەیت؟</p>
                
                <div className="bg-white p-6 rounded-xl mb-6">
                  <p className="mb-4 font-semibold text-gray-800">لە ڕێگەی تێلێگرامەوە بینێرە: <Link href="https://t.me/bnusa_net" target="_blank" className="text-blue-600 hover:text-blue-800 hover:underline">bnusa_net</Link></p>
                  
                  <p className="mb-3 text-gray-800">تکایە ئەمانەش بنێرە:</p>
                  <ul className="space-y-3 mb-4 list-none">
                    <li className="flex items-center">
                      <span className="flex-shrink-0">📖</span>
                      <span className="mr-3">ناوی کتێب</span>
                    </li>
                    <li className="flex items-center">
                      <span className="flex-shrink-0">✍️</span>
                      <span className="mr-3">ناوی نووسەری ڕەسەن (ئەگەر هەیە)</span>
                    </li>
                    <li className="flex items-center">
                      <span className="flex-shrink-0">🗂️</span>
                      <span className="mr-3">ژانر یان پۆلێن</span>
                    </li>
                    <li className="flex items-center">
                      <span className="flex-shrink-0">📝</span>
                      <span className="mr-3">کورتەیەکی کتێب</span>
                    </li>
                    <li className="flex items-center">
                      <span className="flex-shrink-0">🖼️</span>
                      <span className="mr-3">وێنەی بەرگ (ئارەزوومەندانەیە)</span>
                    </li>
                  </ul>
                  
                  <div className="bg-green-50 p-4 rounded-lg flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 ml-3" />
                    <p className="text-green-800 text-base">دوای پێداچوونەوە، کتێبەکە بۆ کتێبخانەی بنووسە زیاد دەکرێت</p>
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <Link href="/bookstore" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center transition-all duration-200">
                    <span>کتێبخانەی بنووسە ببینە</span>
                    <ArrowRightIcon className="h-5 w-5 mr-2" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Be a Designer */}
          <div className="mb-16">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-2xl border border-purple-100">
              <div className="flex items-center mb-6">
                <div className="p-4 bg-purple-100 rounded-lg">
                  <PaintBrushIcon className="h-8 w-8 text-purple-700" />
                </div>
                <h2 className="text-2xl font-bold mr-4 text-gray-800">ببە بە دیزاینەر لە بنووسە</h2>
              </div>
              <div className="text-gray-700 text-lg leading-relaxed text-right">
                <p className="mb-4">داهێنانی خۆت بەکاربهێنە بۆ پشتگیریکردنی دەنگی کوردی لە ڕێگەی دیزاینەوە.</p>
                <p className="mb-6">ئێمە بەدوای دیزاینەری بەهرەمەند و خۆشەویستدا دەگەڕێین بۆ بەشداریکردن لە تیمی خۆبەخشمان و یارمەتیدان لە دیزاینکردنی ناوەڕۆک بۆ سۆشیال میدیای بنووسە.</p>
                
                <div className="bg-white p-6 rounded-xl mb-6">
                  <p className="mb-4 font-semibold text-gray-800">🧪 چۆن کار دەکات:</p>
                  <ol className="space-y-3 mb-6 list-none">
                    <li className="flex items-center">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-base font-semibold">١</span>
                      <span className="mr-6">پەیام بنێرە بۆ ئینستاگرامی ئێمە: <Link href="https://www.instagram.com/bnusa_net?igsh=Z2VmNGZlend4M242" target="_blank" className="text-purple-600 hover:text-purple-800 hover:underline">@bnusa_net</Link></span>
                    </li>
                    <li className="flex items-center">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-base font-semibold">٢</span>
                      <span className="mr-6">ئێمە تاقیکردنەوەیەکی بچووکی دیزاینت بۆ دەنێرین (وەک نموونەی پۆست، بانەر، یان بیرۆکەی پرۆمۆ).</span>
                    </li>
                    <li className="flex items-center">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-base font-semibold">٣</span>
                      <span className="mr-6">ئەگەر سەرکەوتوو بوویت، زیاد دەکرێیت بۆ گرووپی دیزاینەرانمان لە تێلێگرام یان ئینستاگرام.</span>
                    </li>
                    <li className="flex items-center">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-base font-semibold">٤</span>
                      <span className="mr-6">تۆ دەبیتە بەشێک لە تیمی داهێنەرانەی هەفتانەمان، یارمەتی دروستکردنی ناوەڕۆک دەدەیت کە پشتگیری نووسەران، کتێب، وتار و کۆمەڵگەی کوردی دەکات.</span>
                    </li>
                    <li className="flex items-center">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-base font-semibold">٥</span>
                      <span className="mr-6">ئەو دیزاینەرانەی کە بە چالاکی بەشداری دەکەن باجی 🟠 دیزاینەر وەردەگرن، کە لە پڕۆفایلەکەیاندا پیشان دەدرێت.</span>
                    </li>
                  </ol>
                </div>
                
                <div className="flex justify-end mt-6">
                  <Link href="https://www.instagram.com/bnusa_net?igsh=Z2VmNGZlend4M242" target="_blank" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center transition-all duration-200">
                    <span>پەیوەندیمان پێوە بکە</span>
                    <ArrowRightIcon className="h-5 w-5 mr-2" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Badges */}
          <div className="mb-16">
            <div className="bg-white p-8 rounded-2xl border border-gray-100">
              <h2 className="text-2xl font-bold mb-8 text-center text-gray-800">باجەکان و واتاکانیان</h2>
              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 hover:border-blue-300 transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-2xl">🟢</span>
                    </div>
                    <h3 className="font-bold text-xl" style={{ color: "var(--color-blue-800)" }}>نووسەر</h3>
                  </div>
                  <p className="text-gray-700">لانیکەم یەک وتارت بڵاوکردۆتەوە</p>
                </div>
                
                <div className="bg-green-50 p-6 rounded-xl border border-green-100 hover:border-green-300 transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-2xl">🟣</span>
                    </div>
                    <h3 className="font-bold text-xl" style={{ color: "var(--color-green-800)" }}>سەرپەرشتیار</h3>
                  </div>
                  <p className="text-gray-700">یارمەتی بەڕێوەبردنی ناوەڕۆک دەدەیت (وتار یان کتێب)</p>
                </div>
                
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 hover:border-purple-300 transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-2xl">🟠</span>
                    </div>
                    <h3 className="font-bold text-xl" style={{ color: "var(--color-purple-800)" }}>دیزاینەر</h3>
                  </div>
                  <p className="text-gray-700">یارمەتی دیزاینی بنووسە دەدەیت، لەسەر سۆشیال میدیاکانمان پیشان دەدرێن</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Join Community */}
          <div className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="bg-gradient-to-r from-green-50 to-teal-50 p-8 rounded-2xl border border-green-100 hover:border-green-200 transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <ChatBubbleLeftRightIcon className="h-7 w-7 text-green-700" />
                  </div>
                  <h2 className="text-xl font-bold mr-4 text-gray-800">📣 بەشداربە لە کۆمەڵگەی بنووسە</h2>
                </div>
                
                <p className="text-gray-700 mb-4 text-right">
                  پەیوەندی بکە بە نووسەرانی کورد، داهێنەران و خوێنەرانەوە
                </p>
                
                                 <div className="bg-white p-4 rounded-lg mb-4">
                  <div className="flex items-center">
                    <img src="/icons/telegram-icon.svg" alt="Telegram" className="w-8 h-8 ml-3" />
                    <p className="font-semibold text-gray-800">بەشداربە لە گرووپی تێلێگرام:</p>
                  </div>
                  <Link href="https://t.me/bnusa_net" target="_blank" className="mt-3 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-all duration-200">
                    <span>کلیک لێرە بکە بۆ بەشداربوون →</span>
                  </Link>
                </div>
                
                <p className="text-gray-700 text-right">
                  ئاپدەیت، ئامۆژگاری نووسین، پشتگیری کۆمەڵگە و دەستگەیشتنی پێش وەختە بە تایبەتمەندییەکان وەربگرە
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100 hover:border-blue-200 transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <SparklesIcon className="h-7 w-7 text-blue-700" />
                  </div>
                  <h2 className="text-xl font-bold mr-4 text-gray-800">🌱 بنووسە تازە دەستی پێکردووە</h2>
                </div>
                
                <p className="text-gray-700 mb-4 text-right">
                  ئەمە زیاترە لە وێبسایتێک — پلاتفۆرمێکی داهێنەرانەی کوردییە کە گەشە دەکات
                </p>
                
                <p className="text-gray-700 mb-6 text-right">
                  تایبەتمەندی نوێ، کێبڕکێی نووسین و هاوکاری بەڕێوەن. بەشێک بە لە سەرەتاوە
                </p>
                
                                 <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center">
                    <img src="/icons/instagram-icon.svg" alt="Instagram" className="w-8 h-8 ml-3" />
                    <p className="font-semibold text-gray-800">فۆلۆمان بکە لە ئینستاگرام:</p>
                  </div>
                  <Link href="https://www.instagram.com/bnusa_net?igsh=Z2VmNGZlend4M242" target="_blank" className="mt-3 flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-2 px-4 rounded-lg transition-all duration-200">
                    <span>ئینستاگرامی بنووسە</span>
                    <ArrowRightIcon className="h-5 w-5 mr-2" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 