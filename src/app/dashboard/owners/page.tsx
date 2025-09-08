'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface OwnerWithMetrics {
  id: string;
  name: string;
  type: string;
  email: string | null;
  channel: string | null;
  createdAt: string;
  metrics: {
    totalCodes: number;
    totalUses: number;
    totalRevenue: number;
    newCustomerUses: number;
    avgPvi: number;
    avgRoi: number;
  };
}

export default function OwnersPage() {
  const [owners, setOwners] = useState<OwnerWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'revenue' | 'uses' | 'pvi' | 'roi'>('revenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    try {
      const response = await fetch('/api/metrics?type=owners');
      const data = await response.json();
      setOwners(data);
    } catch (error) {
      console.error('Error fetching owners:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedOwners = [...owners].sort((a, b) => {
    let aValue: number;
    let bValue: number;

    switch (sortBy) {
      case 'revenue':
        aValue = a.metrics.totalRevenue;
        bValue = b.metrics.totalRevenue;
        break;
      case 'uses':
        aValue = a.metrics.totalUses;
        bValue = b.metrics.totalUses;
        break;
      case 'pvi':
        aValue = a.metrics.avgPvi;
        bValue = b.metrics.avgPvi;
        break;
      case 'roi':
        aValue = a.metrics.avgRoi;
        bValue = b.metrics.avgRoi;
        break;
      default:
        return 0;
    }

    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Owners Performance</h1>
              <p className="text-gray-600">Track influencers, reps, and campaign performance</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => window.open('/api/export?type=owners&format=csv', '_blank')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Export CSV
              </button>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-sm font-medium text-gray-500">Total Owners</div>
            <div className="text-2xl font-semibold text-gray-900">{owners.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-sm font-medium text-gray-500">Influencers</div>
            <div className="text-2xl font-semibold text-gray-900">
              {owners.filter(o => o.type === 'INFLUENCER').length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-sm font-medium text-gray-500">Reps</div>
            <div className="text-2xl font-semibold text-gray-900">
              {owners.filter(o => o.type === 'REP').length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-sm font-medium text-gray-500">Campaigns</div>
            <div className="text-2xl font-semibold text-gray-900">
              {owners.filter(o => o.type === 'CAMPAIGN').length}
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Revenue Generator</h3>
            {sortedOwners.length > 0 && (
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">{sortedOwners[0].name}</div>
                  <div className="text-sm text-gray-500">{sortedOwners[0].type}</div>
                  <div className="text-lg font-semibold text-gray-900">
                    ${sortedOwners[0].metrics.totalRevenue.toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Highest PVI</h3>
            {sortedOwners.length > 0 && (
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">
                    {[...owners].sort((a, b) => b.metrics.avgPvi - a.metrics.avgPvi)[0]?.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {[...owners].sort((a, b) => b.metrics.avgPvi - a.metrics.avgPvi)[0]?.type}
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {[...owners].sort((a, b) => b.metrics.avgPvi - a.metrics.avgPvi)[0]?.metrics.avgPvi.toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Active</h3>
            {sortedOwners.length > 0 && (
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">
                    {[...owners].sort((a, b) => b.metrics.totalUses - a.metrics.totalUses)[0]?.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {[...owners].sort((a, b) => b.metrics.totalUses - a.metrics.totalUses)[0]?.type}
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {[...owners].sort((a, b) => b.metrics.totalUses - a.metrics.totalUses)[0]?.metrics.totalUses} uses
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Owners Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">All Owners</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Codes
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('uses')}
                  >
                    Uses {sortBy === 'uses' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('revenue')}
                  >
                    Revenue {sortBy === 'revenue' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('pvi')}
                  >
                    Avg PVI {sortBy === 'pvi' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('roi')}
                  >
                    Avg ROI {sortBy === 'roi' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    New %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedOwners.map((owner) => (
                  <tr key={owner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div>
                        <div>{owner.name}</div>
                        {owner.email && (
                          <div className="text-xs text-gray-400">{owner.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        owner.type === 'INFLUENCER' ? 'bg-pink-100 text-pink-800' :
                        owner.type === 'REP' ? 'bg-blue-100 text-blue-800' :
                        owner.type === 'CAMPAIGN' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {owner.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {owner.channel || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {owner.metrics.totalCodes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {owner.metrics.totalUses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${owner.metrics.totalRevenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`font-medium ${
                        owner.metrics.avgPvi >= 1 ? 'text-green-600' : 
                        owner.metrics.avgPvi >= 0.5 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {owner.metrics.avgPvi.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`font-medium ${
                        owner.metrics.avgRoi >= 3 ? 'text-green-600' : 
                        owner.metrics.avgRoi >= 1 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {owner.metrics.avgRoi.toFixed(2)}x
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {owner.metrics.totalUses > 0 ? 
                        ((owner.metrics.newCustomerUses / owner.metrics.totalUses) * 100).toFixed(1) + '%' : 
                        '0%'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
