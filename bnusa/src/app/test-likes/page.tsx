'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/utils/api';

export default function TestLikesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [likeStates, setLikeStates] = useState<{[key: string]: {count: number, hasLiked: boolean}}>({});
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/articles?limit=5');
      if (response.success) {
        setArticles(response.articles);
        // Fetch like data for each article
        response.articles.forEach((article: any) => {
          fetchLikeData(article._id);
        });
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      showToast('error', 'کێشەیەک هەبوو لە بارکردنی وتارەکان');
    } finally {
      setLoading(false);
    }
  };

  const fetchLikeData = async (articleId: string) => {
    try {
      // Get like count
      const countResponse = await api.get(`/api/likes/${articleId}/count`);
      const count = countResponse.success ? countResponse.count : 0;

      // Check if user has liked (only if user is authenticated)
      let hasLiked = false;
      if (currentUser) {
        const likeStatusResponse = await api.get(`/api/likes/${articleId}/check`);
        hasLiked = likeStatusResponse.success ? likeStatusResponse.hasLiked : false;
      }

      setLikeStates(prev => ({
        ...prev,
        [articleId]: { count, hasLiked }
      }));
    } catch (error) {
      console.error('Error fetching like data:', error);
    }
  };

  const handleLikeToggle = async (articleId: string) => {
    if (!currentUser) {
      showToast('info', 'پێویستە چوونە ژوورەوە بکەیت بۆ پسندکردنی وتارەکان');
      return;
    }

    const currentState = likeStates[articleId];
    if (!currentState) return;

    try {
      const action = currentState.hasLiked ? 'unlike' : 'like';
      const response = await api.post(`/api/likes/${articleId}/toggle`, { action });
      
      if (response.success) {
        setLikeStates(prev => ({
          ...prev,
          [articleId]: {
            count: response.likes,
            hasLiked: response.hasLiked
          }
        }));
        
        const message = currentState.hasLiked 
          ? 'وتارەکە لە پسندکردنەکانت لابردرا' 
          : 'وتارەکە بە سەرکەوتوویی پسندکرا';
        showToast('success', message);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      showToast('error', 'کێشەیەک هەبوو لە پسندکردنی وتارەکە');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">چاوەڕوانی بارکردنی وتارەکان بکە...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            تاقیکردنەوەی سیستەمی پسندکردن
          </h1>
          
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">سیستەمی پسندکردن</h2>
            <p className="text-gray-600 mb-4">
              ئەم پەڕەیە بۆ تاقیکردنەوەی سیستەمی پسندکردنی نوێ دروست کراوە. 
              دەتوانیت وتارەکان پسند بکەیت یان لە پسندکردنەکانت لابەیت.
            </p>
            {!currentUser && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  <strong>تێبینی:</strong> پێویستە چوونە ژوورەوە بکەیت بۆ پسندکردنی وتارەکان.
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-6">
            {articles.map((article) => {
              const likeState = likeStates[article._id] || { count: 0, hasLiked: false };
              
              return (
                <div key={article._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{article.title}</h3>
                    <p className="text-gray-600 mb-4">{article.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>نووسەر: {article.author?.name || 'نەناسراو'}</span>
                        <span>بینین: {article.views || 0}</span>
                        <span>پسندکردن: {likeState.count}</span>
                      </div>
                      
                      <button
                        onClick={() => handleLikeToggle(article._id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                          likeState.hasLiked 
                            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-5 w-5 ${likeState.hasLiked ? 'fill-current' : 'stroke-current fill-none'}`} 
                          viewBox="0 0 24 24" 
                          strokeWidth={likeState.hasLiked ? 0 : 2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{likeState.hasLiked ? 'پسندکراوە' : 'پسندکردن'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {articles.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-600">هیچ وتارێک نەدۆزرایەوە.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 