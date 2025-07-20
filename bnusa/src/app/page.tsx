'use client';

import React, { useState, useEffect } from 'react';
import HeroSection from '@/components/HeroSection';
import FeaturedArticles from '@/components/FeaturedArticles';
import FeaturedBooks from '@/components/FeaturedBooks';
import CategorySection from '@/components/CategorySection';
import WhyChooseBnusa from '@/components/WhyChooseBnusa';
import JoinCTA from '@/components/JoinCTA';
import PlatformStats from '@/components/PlatformStats';
import BnusaWriteOptions from '@/components/BnusaWriteOptions';
import Testimonials from '@/components/Testimonials';
import api from '@/utils/api';

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
  likes: string[];
  comments: any[];
  slug: string;
  status?: string;
};

type Book = {
  _id: string;
  id?: string;
  title: string;
  writer: string;
  language: string;
  genre: string;
  year: number;
  image: string;
  rating: number;
  downloads: number;
};

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [totalBooks, setTotalBooks] = useState<number>(0);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [loadingBooks, setLoadingBooks] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        // Fetch only the number of articles to display (6)
        const data = await api.get('/api/articles?limit=6');
        if (data.success) {
          setArticles(data.articles);
        }
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoadingArticles(false);
      }
    };

    const fetchBooks = async () => {
      try {
        // Fetch latest books using the secure API utility
        const data = await api.get('/api/books?limit=6&sort=newest');
        
        if (data.success) {
          setBooks(data.books || []);
          setTotalBooks(data.pagination?.total || 0);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setLoadingBooks(false);
      }
    };

    fetchArticles();
    fetchBooks();
  }, []);

  return (
    <main className="min-h-screen" style={{ fontFamily: "'Rabar 021', sans-serif" }}>
      {/* Hero Section */}
      <HeroSection />
      
      {/* Featured Articles section */}
      <FeaturedArticles articles={articles} loading={loadingArticles} />
      
      {/* Featured Books section */}
      <FeaturedBooks books={books} loading={loadingBooks} totalBooks={totalBooks} />
      
      {/* Platform Statistics */}
      <PlatformStats bookCount={totalBooks} />
      
      {/* What can you write in Bnusa? section */}
      <BnusaWriteOptions />
      
      {/* Categories section */}
      <CategorySection />
      
      {/* Why Choose Bnusa section */}
      <WhyChooseBnusa />
      
      {/* Join CTA section */}
      <JoinCTA />
    </main>
  );
}
