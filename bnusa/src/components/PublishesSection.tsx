'use client';

import { useEffect, useState } from 'react';
import ArticleCard from './ArticleCard';
import ScrollAnimation from './ScrollAnimation';
import Link from 'next/link';
import api from '@/utils/api';

// Define the Article type
interface Author {
  name: string;
  username?: string;
  profileImage?: string;
  isWriter?: boolean;
}

interface Article {
  _id: string;
  title: string;
  description: string;
  author: Author;
  slug: string;
  categories?: string[];
  status?: string;
  coverImage?: string;
}

const PublishesSection = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalArticles, setTotalArticles] = useState(0);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        
        // Use the API utility for authenticated requests
        const data = await api.get('/api/articles/latest?limit=6');
        
        if (data.success) {
          setArticles(data.articles);
          
          // Get the total number of articles
          const totalData = await api.get('/api/articles');
          setTotalArticles(totalData.total || totalData.count || 0);
        } else {
          throw new Error(data.message || 'Failed to fetch articles');
        }
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError('Failed to load articles. Please try again later.');
        
        // Fallback to sample data in case of error
        setArticles([
          {
            _id: "1",
            title: 'کاریگەری گۆڕانی کەش و هەوا لەسەر کشتوکاڵی کوردستان',
            description: 'شیکاریەکی قووڵ لەسەر چۆنیەتی کاریگەری گۆڕانی کەش و هەوا بەسەر کشتوکاڵ لە کوردستان و ئەو چارەسەرە بەردەوامانەی کە جێبەجێ دەکرێن.',
            author: {
              name: 'ئازاد کەریم',
              username: 'azad_k'
            },
            slug: 'climate-change-kurdish-agriculture',
            categories: ['ژینگە', 'زانست']
          },
          {
            _id: "2",
            title: 'مۆسیقای کوردی بە درێژایی مێژوو: دیدگایەکی مێژوویی',
            description: 'کاوە لە مێژووی دەوڵەمەندی مۆسیقای کوردی، لە گۆرانی گەلییە نەریتیەکانەوە تا سەرنجدانە هاوچەرخەکان و گرنگی کەلتوریان.',
            author: {
              name: 'لەیلا ئەحمەد',
              username: 'leila_a'
            },
            slug: 'kurdish-music-historical-perspective',
            categories: ['مێژوو', 'هونەر']
          },
          {
            _id: "3",
            title: 'فەلسەفەی ئیبن سینا و گرنگیەکەی لە ئەمڕۆدا',
            description: 'کاوە لە کارە فەلسەفیەکانی ئیبن سینا (ئەڤیچێنا) و چۆن بیرۆکەکانی بەردەوامن لە کاریگەری لەسەر بیرکردنەوەی هاوچەرخ لە پزیشکی و فەلسەفەدا.',
            author: {
              name: 'دارا حەسەن',
              username: 'dara_h'
            },
            slug: 'ibn-sina-philosophy-relevance',
            categories: ['فەلسەفە', 'مێژوو']
          },
          {
            _id: "4",
            title: 'ئەدەبی هاوچەرخی کوردی: نووسەران و تێماکانی نوێ',
            description: 'دۆزینەوەی نەوەی نوێی نووسەرانی کورد و تێما هاوچەرخانەی کە لە کارەکانیاندا کاوە دەکەن.',
            author: {
              name: 'شیرین بەرزانی',
              username: 'shirin_b'
            },
            slug: 'modern-kurdish-literature',
            categories: ['ئەدەب']
          },
          {
            _id: "5",
            title: 'داهێنانی تەکنۆلۆژی لە کوردستان: کۆمپانیا نوێیەکان',
            description: 'سەرنجێک لەسەر ژینگەی تەکنۆلۆژیای گەشەسەندوو لە کوردستان و ئەو داهێنانە نوێیانەی کە لە ناوچەکەدا شەپۆل دروست دەکەن.',
            author: {
              name: 'رێباز عەلی',
              username: 'rebaz_a'
            },
            slug: 'tech-innovation-kurdistan',
            categories: ['تەکنەلۆژیا']
          },
          {
            _id: "6",
            title: 'هونەری قاڵی چنینی کوردی: پاراستنی پیشەی نەریتی',
            description: 'فێربە دەربارەی هونەری دێرینی قاڵی چنینی کوردی، گرنگی کەلتوریەکەی، و هەوڵەکان بۆ پاراستنی ئەم پیشە نەریتیە.',
            author: {
              name: 'نارین رەشید',
              username: 'narin_r'
            },
            slug: 'kurdish-carpet-weaving',
            categories: ['هونەر', 'مێژوو']
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  return (
    <section className="py-16 bg-[var(--grey-light)]/30">
      <div className="container mx-auto">
        <ScrollAnimation animation="fade-up">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)]">
              دوایین <span className="text-[var(--primary)]">بڵاوکراوەکان</span>
            </h2>
            <p className="mt-4 text-[var(--grey-dark)] max-w-2xl mx-auto">
              دۆزینەوەی وتارە بیرۆکە-پڕەکان لەسەر زانست، مێژوو، هونەر و زیاتر کە لەلایەن کۆمەڵگەی نووسەرانی کوردمانەوە نووسراون.
            </p>
            {totalArticles > 6 && (
              <p className="mt-2 text-sm text-[var(--grey)]">نیشاندانی ٦ لە کۆی {totalArticles} وتار</p>
            )}
          </div>
        </ScrollAnimation>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {articles.map((article, index) => (
              <ScrollAnimation 
                key={article._id} 
                animation="fade-up" 
                delay={100 + index * 100} 
                threshold={0.1}
              >
                <ArticleCard
                  title={article.title}
                  description={article.description}
                  author={article.author}
                  slug={article.slug}
                  categories={article.categories}
                  status={article.status}
                  coverImage={article.coverImage}
                />
              </ScrollAnimation>
            ))}
          </div>
        )}

        <ScrollAnimation animation="fade-up" delay={800}>
          <div className="mt-12 text-center">
            <Link href="/publishes" className="btn btn-primary px-8 py-3">
              بینینی هەموو بڵاوکراوەکان
            </Link>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
};

export default PublishesSection; 