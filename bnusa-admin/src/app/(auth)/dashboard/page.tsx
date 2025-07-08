'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import { UserCircleIcon, DocumentTextIcon, CogIcon, ChartBarIcon, UsersIcon, PencilSquareIcon, NewspaperIcon, ClockIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { isAuthenticated } from '@/lib/auth';

interface DashboardStats {
  totalUsers: number;
  totalArticles: number;
  newUsers: number;
  newArticles: number;
  pendingArticles: number;
  writers: number;
}

interface RecentUser {
  _id: string;
  name: string;
  username: string;
  email: string;
  profileImage?: string;
  createdAt: string;
}

interface RecentArticle {
  _id: string;
  title: string;
  slug: string;
  createdAt: string;
  author: {
    name: string;
    username: string;
  };
}

interface DashboardData {
  stats: DashboardStats;
  recentUsers: RecentUser[];
  recentArticles: RecentArticle[];
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Double-check authentication on client side as well
  useLayoutEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get auth token from local storage
        const token = localStorage.getItem('authToken');
        
        // Make API request with auth token
        const response = await fetch('/api/admin/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.status} ${response.statusText}`);
        }

        const responseData = await response.json();
        
        if (!responseData.success) {
          throw new Error(responseData.message || 'Failed to load dashboard data');
        }
        
        setData(responseData.data);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'An error occurred while loading dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Create stat cards data
  const statCards = [
    {
      name: 'Total Users',
      value: data?.stats.totalUsers || 0,
      icon: UsersIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Total Articles',
      value: data?.stats.totalArticles || 0,
      icon: DocumentTextIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Writers',
      value: data?.stats.writers || 0,
      icon: PencilSquareIcon,
      color: 'bg-purple-500'
    },
    {
      name: 'New Articles (Last 30 days)',
      value: data?.stats.newArticles || 0,
      icon: NewspaperIcon,
      color: 'bg-yellow-500'
    },
    {
      name: 'Pending Articles',
      value: data?.stats.pendingArticles || 0,
      icon: ClockIcon,
      color: 'bg-orange-500',
      action: data?.stats.pendingArticles ? '/articles/pending' : undefined,
      actionText: 'Review'
    }
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stat.value}</div>
                    </dd>
                  </dl>
                </div>
                {stat.action && stat.value > 0 && (
                  <Link href={stat.action} className="ml-auto inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    {stat.actionText || 'View'}
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Recent Users */}
      <h2 className="mt-8 text-lg font-medium text-gray-900">Recent Users</h2>
      <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {data?.recentUsers?.map((user) => (
            <li key={user._id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center">
                  <div className="min-w-0 flex-1 flex items-center">
                    <div className="flex-shrink-0">
                      {user.profileImage ? (
                        <img
                          className="h-12 w-12 rounded-full"
                          src={user.profileImage}
                          alt={user.name}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserCircleIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 px-4">
                      <div>
                        <p className="text-sm font-medium text-indigo-600 truncate">{user.name}</p>
                        <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span>{user.email}</span>
                        <span className="ml-2 text-xs text-gray-400">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Recent Articles */}
      <h2 className="mt-8 text-lg font-medium text-gray-900">Recent Articles</h2>
      <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {data?.recentArticles?.map((article) => (
            <li key={article._id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-indigo-600 truncate">{article.title}</p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Published
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      By {article.author.name} (@{article.author.username})
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(article.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 