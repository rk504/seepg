'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CodeWithMetrics {
  id: string;
  code: string;
  owner: {
    name: string;
    type: string;
  };
  channel: string;
  campaign: string | null;
  isActive: boolean;
  createdAt: string;
  metrics: {
    totalUses: number;
    totalRevenue: number;
    totalDiscount: number;
    newCustomerUses: number;
    roi: number;
    pvi: number;
    leakage: number;
  };
}

export default function CodesPage() {
  const [codes, setCodes] = useState<CodeWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'uses' | 'revenue' | 'roi' | 'pvi'>('uses');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const response = await fetch('/api/metrics?type=codes');
      const data = await response.json();
      setCodes(data);
    } catch (error) {
      console.error('Error fetching codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortedCodes = [...codes].sort((a, b) => {
    let aValue: number;
    let bValue: number;

    switch (sortBy) {
      case 'uses':
        aValue = a.metrics.totalUses;
        bValue = b.metrics.totalUses;
        break;
      case 'revenue':
        aValue = a.metrics.totalRevenue;
        bValue = b.metrics.totalRevenue;
        break;
      case 'roi':
        aValue = a.metrics.roi;
        bValue = b.metrics.roi;
        break;
      case 'pvi':
        aValue = a.metrics.pvi;
        bValue = b.metrics.pvi;
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
              <h1 className="text-3xl font-bold text-gray-900">Promo Codes</h1>
              <p className="text-gray-600">Track performance and ROI of all promo codes</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => window.open('/api/export?type=codes&format=csv', '_blank')}
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
            <div className="text-sm font-medium text-gray-500">Total Codes</div>
            <div className="text-2xl font-semibold text-gray-900">{codes.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-sm font-medium text-gray-500">Active Codes</div>
            <div className="text-2xl font-semibold text-gray-900">
              {codes.filter(c => c.isActive).length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-sm font-medium text-gray-500">Total Uses</div>
            <div className="text-2xl font-semibold text-gray-900">
              {codes.reduce((sum, c) => sum + c.metrics.totalUses, 0)}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-sm font-medium text-gray-500">Total Revenue</div>
            <div className="text-2xl font-semibold text-gray-900">
              ${codes.reduce((sum, c) => sum + c.metrics.totalRevenue, 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Codes Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">All Promo Codes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
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
                    onClick={() => handleSort('roi')}
                  >
                    ROI {sortBy === 'roi' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('pvi')}
                  >
                    PVI {sortBy === 'pvi' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    New %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leakage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedCodes.map((code) => (
                  <tr key={code.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {code.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div className="font-medium">{code.owner.name}</div>
                        <div className="text-xs text-gray-400">{code.owner.type}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {code.channel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {code.campaign || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {code.metrics.totalUses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${code.metrics.totalRevenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`font-medium ${
                        code.metrics.roi >= 3 ? 'text-green-600' : 
                        code.metrics.roi >= 1 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {code.metrics.roi.toFixed(2)}x
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`font-medium ${
                        code.metrics.pvi >= 1 ? 'text-green-600' : 
                        code.metrics.pvi >= 0.5 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {code.metrics.pvi.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {code.metrics.totalUses > 0 ? 
                        ((code.metrics.newCustomerUses / code.metrics.totalUses) * 100).toFixed(1) + '%' : 
                        '0%'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`font-medium ${
                        code.metrics.leakage <= 0.3 ? 'text-green-600' : 
                        code.metrics.leakage <= 0.6 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {(code.metrics.leakage * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        code.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {code.isActive ? 'Active' : 'Inactive'}
                      </span>
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
