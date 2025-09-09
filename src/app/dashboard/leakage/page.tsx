'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AnomalyFlag {
  id: string;
  type: string;
  severity: string;
  message: string;
  metadata: Record<string, any>;
  isResolved: boolean;
  createdAt: string;
  resolvedAt: string | null;
  code: {
    code: string;
    owner: {
      name: string;
      type: string;
    };
  };
}

export default function LeakagePage() {
  const [anomalies, setAnomalies] = useState<AnomalyFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'critical' | 'high'>('unresolved');

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const fetchAnomalies = async () => {
    try {
      const response = await fetch('/api/metrics?type=anomalies');
      const data = await response.json();
      setAnomalies(data);
    } catch (error) {
      console.error('Error fetching anomalies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnomalies = anomalies.filter(anomaly => {
    switch (filter) {
      case 'unresolved':
        return !anomaly.isResolved;
      case 'critical':
        return anomaly.severity === 'CRITICAL';
      case 'high':
        return anomaly.severity === 'HIGH';
      default:
        return true;
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SPIKE_REDEMPTION':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      case 'LEAKAGE_DETECTED':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'LOW_PVI':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'UNUSUAL_PATTERN':
        return (
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
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
              <h1 className="text-3xl font-bold text-gray-900">Leakage Analysis</h1>
              <p className="text-gray-600">Detect and prevent promo code leakage and anomalies</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => window.open('/api/export?type=anomalies&format=csv', '_blank')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Export CSV
              </button>
              <Link
                href="/"
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
            <div className="text-sm font-medium text-gray-500">Total Anomalies</div>
            <div className="text-2xl font-semibold text-gray-900">{anomalies.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-sm font-medium text-gray-500">Unresolved</div>
            <div className="text-2xl font-semibold text-gray-900">
              {anomalies.filter(a => !a.isResolved).length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-sm font-medium text-gray-500">Critical</div>
            <div className="text-2xl font-semibold text-red-600">
              {anomalies.filter(a => a.severity === 'CRITICAL').length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-sm font-medium text-gray-500">High Priority</div>
            <div className="text-2xl font-semibold text-orange-600">
              {anomalies.filter(a => a.severity === 'HIGH').length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unresolved')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unresolved' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Unresolved
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'critical' 
                  ? 'bg-red-100 text-red-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setFilter('high')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'high' 
                  ? 'bg-orange-100 text-orange-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              High Priority
            </button>
          </div>
        </div>

        {/* Anomalies List */}
        <div className="space-y-4">
          {filteredAnomalies.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No anomalies found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'unresolved' ? 'All anomalies have been resolved.' : 'No anomalies match the current filter.'}
              </p>
            </div>
          ) : (
            filteredAnomalies.map((anomaly) => (
              <div key={anomaly.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      {getTypeIcon(anomaly.type)}
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">{anomaly.message}</h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(anomaly.severity)}`}>
                          {anomaly.severity}
                        </span>
                        {anomaly.isResolved && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Resolved
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(anomaly.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Code:</span> {anomaly.code.code} | 
                        <span className="font-medium ml-2">Owner:</span> {anomaly.code.owner.name} ({anomaly.code.owner.type})
                      </div>
                    </div>

                    {anomaly.metadata && Object.keys(anomaly.metadata).length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm font-medium text-gray-700 mb-2">Details:</div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                            {JSON.stringify(anomaly.metadata, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {!anomaly.isResolved && (
                      <div className="mt-4 flex space-x-3">
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                          Mark as Resolved
                        </button>
                        <button className="text-sm text-gray-600 hover:text-gray-700 font-medium">
                          Investigate
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
