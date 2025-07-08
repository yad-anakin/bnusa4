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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await api.get('/api/users?limit=100', {}, {
          useCache: false,
          cacheDuration: 0
        });
        
        console.log('API response:', data);
        
        if (data.success && data.users) {
          setUsers(data.users);
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
  }, []);

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
            <p>Total users: {users.length}</p>
            <p>Writers: {writerCount}</p>
            <p>Supervisors: {supervisorCount}</p>
            <p>Designers: {designerCount}</p>
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
        </>
      )}
    </div>
  );
} 