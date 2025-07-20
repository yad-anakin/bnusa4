'use client';

import React from 'react';
import Link from 'next/link';
import ImageWithFallback from './ImageWithFallback';
import { useTheme } from '@/utils/themeContext';
import ArticleCard from './ArticleCard';

type Article = {
  _id: string;
  title: string;
  description: string;
  coverImage: string;
  categories: string[];
  views: number;
  readTime: number;
  createdAt: string;
  author: {
    _id: string;
    name: string;
    username: string;
    profileImage: string;
  };
  slug?: string;
  status?: string;
};

type FeaturedArticlesProps = {
  articles: Article[];
  loading: boolean;
};

const FeaturedArticles = ({ articles, loading }: FeaturedArticlesProps) => {
  const { reduceMotion } = useTheme();
  
  // Number of articles to display
  const articlesToShow = 6;
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Format: YYYY/MM/DD
    return date.toLocaleDateString('ku-IQ');
  };

  // For debugging in the UI
  const getArticleLink = (article: Article) => {
    if (article.id) {
      return `/publishes/${article.id}`;
    } else {
      console.warn('Article missing id, falling back to _id:', article.title);
      return `/publishes/${article._id}`;
    }
  };

  const animationClass = reduceMotion ? '' : 'transition-all duration-500 ease-out';

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">نوێترین  وتارەکان</h2>
          <div className="flex justify-center items-center h-64">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
          </div>
        </div>
      </section>
    );
  }

  // Display a message if no articles are found
  if (articles.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8">نوێترین  وتارەکان</h2>
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-[var(--grey-dark)]">هیچ وتارێک نەدۆزرایەوە.</p>
            <p className="mt-4">
              <Link href="/write-here" className="text-[var(--primary)] hover:underline">
                دەست بکە بە نووسین!
              </Link>
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Get a slice of articles to show
  const displayedArticles = articles.slice(0, articlesToShow);

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col mb-8">
          <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold mb-8">نوێترین  وتارەکان</h2>
            <Link href="/publishes" className="text-[var(--primary)] hover:underline flex items-center">
              هەموو وتارەکان ببینە
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
          {articles.length > articlesToShow && (
            <p className="text-sm text-[var(--grey)] mt-2">
              نیشاندانی {displayedArticles.length} لە کۆی {articles.length} وتار
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedArticles.map((article, index) => (
            <div
              key={article._id}
              className={`${animationClass} ${
                reduceMotion ? '' : `opacity-0 translate-y-4`
              }`}
              style={{ 
                animation: reduceMotion ? 'none' : `fadeInUp 0.5s ease-out ${index * 0.1 + 0.2}s forwards` 
              }}
            >
              <ArticleCard
                title={article.title}
                description={article.description}
                author={article.author}
                slug={article.slug || article._id}
                categories={article.categories}
                status={article.status}
                coverImage={article.coverImage}
              />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
};

export default FeaturedArticles;