'use client';

import React, { useEffect, useState } from 'react';
import api from '@/utils/api';

export default function TestRolesPage() {
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Direct API call with no caching
        const data = await api.get('/api/users?limit=100', {}, {
          useCache: false,
          cacheDuration: 0
        });
        
        setApiResponse(data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Extract users and count roles
  const users = apiResponse?.users || [];
  const writerCount = users.filter((user: any) => user.isWriter === true).length;
  const supervisorCount = users.filter((user: any) => user.isSupervisor === true).length;
  const designerCount = users.filter((user: any) => user.isDesigner === true).length;
  
  const writerCountLoose = users.filter((user: any) => !!user.isWriter).length;
  const supervisorCountLoose = users.filter((user: any) => !!user.isSupervisor).length;
  const designerCountLoose = users.filter((user: any) => !!user.isDesigner).length;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">API Response Test</h1>
      
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : (
        <div>
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Role Counts</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">Strict Equality (===)</h3>
                <ul className="list-disc pl-5">
                  <li>Writers: {writerCount}</li>
                  <li>Supervisors: {supervisorCount}</li>
                  <li>Designers: {designerCount}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">Loose Equality (!!)</h3>
                <ul className="list-disc pl-5">
                  <li>Writers: {writerCountLoose}</li>
                  <li>Supervisors: {supervisorCountLoose}</li>
                  <li>Designers: {designerCountLoose}</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Raw User Data (First 5)</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b">Name</th>
                    <th className="py-2 px-4 border-b">Username</th>
                    <th className="py-2 px-4 border-b">isWriter</th>
                    <th className="py-2 px-4 border-b">isSupervisor</th>
                    <th className="py-2 px-4 border-b">isDesigner</th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 5).map((user: any) => (
                    <tr key={user._id}>
                      <td className="py-2 px-4 border-b">{user.name}</td>
                      <td className="py-2 px-4 border-b">{user.username}</td>
                      <td className="py-2 px-4 border-b">{String(user.isWriter)} ({typeof user.isWriter})</td>
                      <td className="py-2 px-4 border-b">{String(user.isSupervisor)} ({typeof user.isSupervisor})</td>
                      <td className="py-2 px-4 border-b">{String(user.isDesigner)} ({typeof user.isDesigner})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">API Response</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
} 