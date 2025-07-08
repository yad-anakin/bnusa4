'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import { UserCircleIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { isAuthenticated } from '@/lib/auth';

// Define the user type
interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  profileImage?: string;
  role: string;
  active: boolean;
  createdAt: string;
  isWriter?: boolean;
}

// Define pagination data type
interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  // Double-check authentication on client side
  useLayoutEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
    }
  }, []);

  const fetchUsers = async (page = 1, search = '') => {
    try {
      setIsLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });
      
      if (search) {
        queryParams.append('search', search);
      }

      console.log(`Fetching users: /api/admin/users?${queryParams.toString()}`);
      
      // Get auth token from local storage
      const token = localStorage.getItem('authToken');
      
      // Use the local API route with auth token
      const response = await fetch(`/api/admin/users?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch users');
      }
      
      console.log('Fetched users:', data);
      setUsers(data.users || []);
      setPagination(data.pagination);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'An error occurred while fetching users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(pagination.page, searchQuery);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1, searchQuery);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // Get auth token from local storage
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user role');
      }

      // Update user in the state (optimistic update)
      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, role: newRole } 
          : user
      ));
    } catch (err: any) {
      console.error('Error updating user role:', err);
      setError(err.message || 'An error occurred while updating user role');
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      // Get auth token from local storage
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: isActive }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user status');
      }

      // Update user in the state (optimistic update)
      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, active: isActive } 
          : user
      ));
    } catch (err: any) {
      console.error('Error updating user status:', err);
      setError(err.message || 'An error occurred while updating user status');
    }
  };

  const toggleWriterStatus = async (userId: string, isWriter: boolean) => {
    try {
      // Get auth token from local storage
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isWriter }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update writer status');
      }

      // Update user in the state (optimistic update)
      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, isWriter } 
          : user
      ));
    } catch (err: any) {
      console.error('Error updating writer status:', err);
      setError(err.message || 'An error occurred while updating writer status');
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setDeletingUser(userId);
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete user');
      }

      // Remove user from the state
      setUsers(users.filter(user => user._id !== userId));
      setShowDeleteConfirm(null);
      
      // Update pagination count
      setPagination(prev => ({
        ...prev,
        total: prev.total - 1
      }));
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'An error occurred while deleting user');
    } finally {
      setDeletingUser(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <div className="flex items-center">
          <form onSubmit={handleSearch} className="flex mr-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="submit"
              className="bg-indigo-600 px-4 py-2 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Search
            </button>
          </form>
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
        <>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No users found</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {users.map((user) => (
                  <li key={user._id} className="hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
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
                          <div className="ml-4">
                            <div className="text-sm font-medium text-indigo-600">
                              {user.name}
                              {user.isWriter && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                                  Writer
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div>
                            <span className="text-xs text-gray-500">Role: </span>
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user._id, e.target.value)}
                              className="text-sm border border-gray-300 rounded-md p-1"
                            >
                              <option value="user">User</option>
                              <option value="editor">Editor</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={user.active}
                                onChange={() => toggleUserStatus(user._id, !user.active)}
                                className="sr-only peer"
                              />
                              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                              <span className="ms-3 text-sm font-medium text-gray-500">{user.active ? 'Active' : 'Inactive'}</span>
                            </label>
                          </div>
                          
                          <div>
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={user.isWriter}
                                onChange={() => toggleWriterStatus(user._id, !user.isWriter)}
                                className="sr-only peer"
                              />
                              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              <span className="ms-3 text-sm font-medium text-gray-500">Writer</span>
                            </label>
                          </div>
                          
                          <div>
                            {showDeleteConfirm === user._id ? (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => deleteUser(user._id)}
                                  disabled={deletingUser === user._id}
                                  className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                                >
                                  {deletingUser === user._id ? 'Deleting...' : 'Confirm'}
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(null)}
                                  className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowDeleteConfirm(user._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pagination controls */}
          {pagination.pages > 1 && (
            <div className="py-3 flex items-center justify-between border-t border-gray-200 mt-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total}</span> users
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => fetchUsers(1, searchQuery)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">First</span>
                      <span>First</span>
                    </button>
                    <button
                      onClick={() => fetchUsers(Math.max(1, pagination.page - 1), searchQuery)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <span>Prev</span>
                    </button>
                    <button
                      onClick={() => fetchUsers(Math.min(pagination.pages, pagination.page + 1), searchQuery)}
                      disabled={pagination.page === pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <span>Next</span>
                    </button>
                    <button
                      onClick={() => fetchUsers(pagination.pages, searchQuery)}
                      disabled={pagination.page === pagination.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Last</span>
                      <span>Last</span>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 