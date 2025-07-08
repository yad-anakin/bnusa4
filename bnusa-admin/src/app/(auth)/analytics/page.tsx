'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import { ChartBarIcon, UserIcon, DocumentTextIcon, EyeIcon, ChatBubbleLeftIcon, HeartIcon } from '@heroicons/react/24/outline';
import { isAuthenticated } from '@/lib/auth';

// Define analytics data types
interface AnalyticsData {
  totalUsers: number;
  totalArticles: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  newUsersThisMonth: number;
  newArticlesThisMonth: number;
  topArticles: TopArticle[];
  mostActiveUsers: ActiveUser[];
}

interface TopArticle {
  _id: string;
  title: string;
  views: number;
  likes: number;
  author: {
    name: string;
  };
}

interface ActiveUser {
  _id: string;
  name: string;
  articleCount: number;
  totalViews: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'year'

  // Double-check authentication on client side
  useLayoutEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(timeRange);
  }, [timeRange]);

  const fetchAnalytics = async (range: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get auth token from local storage
      const token = localStorage.getItem('authToken');
      
      // In a real implementation, this would query a specific analytics API endpoint
      // For now, we'll use the dashboard API as a placeholder
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      
      if (!responseData.success) {
        throw new Error(responseData.message || 'Failed to fetch analytics');
      }
      
      // Transform dashboard data into analytics format
      // In a real implementation, you would have a dedicated analytics endpoint
      const dashboardData = responseData.data;
      
      // Create placeholder analytics data from dashboard data
      const analyticsData: AnalyticsData = {
        totalUsers: dashboardData.stats.totalUsers || 0,
        totalArticles: dashboardData.stats.totalArticles || 0,
        totalViews: 0, // Placeholder - would come from real analytics endpoint
        totalLikes: 0, // Placeholder
        totalComments: 0, // Placeholder
        newUsersThisMonth: dashboardData.stats.newUsers || 0,
        newArticlesThisMonth: dashboardData.stats.newArticles || 0,
        topArticles: dashboardData.recentArticles.map((article: any) => ({
          _id: article._id,
          title: article.title,
          views: Math.floor(Math.random() * 1000), // Placeholder random data
          likes: Math.floor(Math.random() * 100), // Placeholder
          author: {
            name: article.author.name
          }
        })),
        mostActiveUsers: dashboardData.recentUsers.map((user: any, index: number) => ({
          _id: user._id,
          name: user.name,
          articleCount: Math.floor(Math.random() * 10) + 1, // Placeholder
          totalViews: Math.floor(Math.random() * 5000) // Placeholder
        }))
      };
      
      setData(analyticsData);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'An error occurred while fetching analytics');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
            <option value="year">Past Year</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                    <UserIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                      <dd className="text-lg font-medium text-gray-900">{data?.totalUsers}</dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">New this month</div>
                    <div className="text-sm font-medium text-green-600">{data?.newUsersThisMonth}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <DocumentTextIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Articles</dt>
                      <dd className="text-lg font-medium text-gray-900">{data?.totalArticles}</dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">New this month</div>
                    <div className="text-sm font-medium text-green-600">{data?.newArticlesThisMonth}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <EyeIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Views</dt>
                      <dd className="text-lg font-medium text-gray-900">{data?.totalViews || 'N/A'}</dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">Per article average</div>
                    <div className="text-sm font-medium text-blue-600">
                      {data?.totalArticles ? Math.floor((data?.totalViews || 0) / data.totalArticles) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Top Articles */}
          <h2 className="text-lg font-medium text-gray-900 mb-4">Top Articles</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
            <ul className="divide-y divide-gray-200">
              {data?.topArticles.map((article) => (
                <li key={article._id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">{article.title}</p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <div className="flex items-center text-sm text-gray-500 mr-4">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        {article.views}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <HeartIcon className="h-4 w-4 mr-1" />
                        {article.likes}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        By {article.author.name}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Most Active Users */}
          <h2 className="text-lg font-medium text-gray-900 mb-4">Most Active Users</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {data?.mostActiveUsers.map((user) => (
                <li key={user._id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">{user.name}</p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <div className="flex items-center text-sm text-gray-500 mr-4">
                        <DocumentTextIcon className="h-4 w-4 mr-1" />
                        {user.articleCount} articles
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        {user.totalViews} views
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 