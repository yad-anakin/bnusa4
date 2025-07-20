'use client';

import React, { useEffect, useState } from 'react';
import api from '@/utils/api';

interface User {
  _id: string;
  name: string;
  username: string;
  isWriter?: boolean;
  isSupervisor?: boolean;
  isDesigner?: boolean;
}

export default function TestStaffPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const usersPerPage = 8;
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await api.get(`/api/users?limit=${usersPerPage}&page=${currentPage}`, {}, {
          useCache: false,
          cacheDuration: 0
        });
        console.log('API response:', data);
        if (data.success && data.users) {
          setUsers(data.users);
          setTotalUsers(data.pagination?.total || data.users.length);
          setTotalPages(data.pagination?.pages || 1);
        } else {
          throw new Error('Failed to fetch users');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [currentPage]);

  // Count users with different roles using loose equality
  const writerCount = users.filter(user => !!user.isWriter).length;
  const supervisorCount = users.filter(user => !!user.isSupervisor).length;
  const designerCount = users.filter(user => !!user.isDesigner).length;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test Staff Page</h1>
      
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          <div className="mb-4">
            <p>Total users: {totalUsers}</p>
            <p>Writers: {users.filter(user => !!user.isWriter).length}</p>
            <p>Supervisors: {users.filter(user => !!user.isSupervisor).length}</p>
            <p>Designers: {users.filter(user => !!user.isDesigner).length}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map(user => (
              <div key={user._id} className="border p-4 rounded">
                <h2 className="font-bold">{user.name} ({user.username})</h2>
                <ul className="mt-2">
                  <li>Writer: {user.isWriter ? 'Yes' : 'No'} (raw value: {String(user.isWriter)})</li>
                  <li>Supervisor: {user.isSupervisor ? 'Yes' : 'No'} (raw value: {String(user.isSupervisor)})</li>
                  <li>Designer: {user.isDesigner ? 'Yes' : 'No'} (raw value: {String(user.isDesigner)})</li>
                </ul>
              </div>
            ))}
          </div>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded bg-gray-200 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded bg-gray-200 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 