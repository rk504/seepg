'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  AlertTriangle,
  Users,
  CreditCard,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Download
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MetricCard from '../components/MetricCard';
import ChartCard from '../components/ChartCard';

interface DashboardKPIs {
  totalPromoSpend: number;
  incrementalRevenue: number;
  avgPvi: number;
  leakage: number;
  totalRedemptions: number;
  newCustomerRedemptions: number;
}

export default function HomePage() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      const response = await fetch('/api/metrics?type=dashboard');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setKpis(data);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      setKpis(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to load data</h2>
          <p className="text-gray-600 mb-4">There was an error fetching dashboard data.</p>
          <button
            onClick={fetchKPIs}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const hasData = kpis && (kpis.totalPromoSpend > 0 || kpis.totalRedemptions > 0);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />
        
        {/* Dashboard Content */}
        <main className="flex-1 p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h1>
            <p className="text-gray-600">Here's what's happening with your promo campaigns today.</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Total Promo Spend"
              value={kpis?.totalPromoSpend ?? 0}
              change={12.5}
              changeLabel="vs last month"
              icon={DollarSign}
              color="blue"
              format="currency"
            />
            <MetricCard
              title="Incremental Revenue"
              value={kpis?.incrementalRevenue ?? 0}
              change={8.2}
              changeLabel="vs last month"
              icon={TrendingUp}
              color="green"
              format="currency"
            />
            <MetricCard
              title="Average PVI"
              value={kpis?.avgPvi ?? 0}
              change={-2.1}
              changeLabel="vs last month"
              icon={BarChart3}
              color="purple"
              format="percentage"
            />
            <MetricCard
              title="Leakage Rate"
              value={kpis?.leakage ?? 0}
              change={-5.3}
              changeLabel="vs last month"
              icon={AlertTriangle}
              color="red"
              format="percentage"
            />
          </div>

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Chart */}
            <ChartCard
              title="Revenue Trends"
              subtitle="Last 30 days"
              icon={Activity}
            >
              <div className="h-64 flex items-center justify-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Chart visualization coming soon</p>
                </div>
              </div>
            </ChartCard>

            {/* Top Performing Codes */}
            <ChartCard
              title="Top Performing Codes"
              subtitle="This month"
              icon={CreditCard}
            >
              <div className="space-y-4">
                {hasData ? (
                  <>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-green-600 font-semibold text-sm">1</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">SUMMER20</p>
                          <p className="text-sm text-gray-500">2,450 redemptions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">+24.5%</p>
                        <p className="text-sm text-gray-500">$12.4k revenue</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">2</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">WELCOME10</p>
                          <p className="text-sm text-gray-500">1,890 redemptions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">+18.2%</p>
                        <p className="text-sm text-gray-500">$8.9k revenue</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <span className="text-purple-600 font-semibold text-sm">3</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">FLASH15</p>
                          <p className="text-sm text-gray-500">1,234 redemptions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">-2.1%</p>
                        <p className="text-sm text-gray-500">$5.2k revenue</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No promo codes data available</p>
                  </div>
                )}
              </div>
            </ChartCard>
          </div>

          {/* Quick Stats and Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <ChartCard
              title="Recent Activity"
              subtitle="Last 24 hours"
              icon={Activity}
            >
              {!hasData ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">New redemption: SUMMER20</p>
                      <p className="text-xs text-gray-500">2 minutes ago</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Code WELCOME10 activated</p>
                      <p className="text-xs text-gray-500">15 minutes ago</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">High leakage detected</p>
                      <p className="text-xs text-gray-500">1 hour ago</p>
                    </div>
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  </div>
                </div>
              )}
            </ChartCard>

            {/* Quick Actions */}
            <ChartCard
              title="Quick Actions"
              subtitle="Common tasks"
            >
              <div className="space-y-3">
                <Link
                  href="/dashboard/codes"
                  className="flex items-center p-3 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                >
                  <CreditCard className="h-5 w-5 text-gray-400 group-hover:text-blue-500 mr-3" />
                  <span className="font-medium">View All Codes</span>
                  <ArrowUpRight className="h-4 w-4 text-gray-400 ml-auto" />
                </Link>
                <Link
                  href="/dashboard/owners"
                  className="flex items-center p-3 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                >
                  <Users className="h-5 w-5 text-gray-400 group-hover:text-green-500 mr-3" />
                  <span className="font-medium">Owner Performance</span>
                  <ArrowUpRight className="h-4 w-4 text-gray-400 ml-auto" />
                </Link>
                <Link
                  href="/dashboard/leakage"
                  className="flex items-center p-3 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                >
                  <AlertTriangle className="h-5 w-5 text-gray-400 group-hover:text-red-500 mr-3" />
                  <span className="font-medium">Leakage Analysis</span>
                  <ArrowUpRight className="h-4 w-4 text-gray-400 ml-auto" />
                </Link>
                <button
                  onClick={() => window.open('/api/export?type=codes&format=csv', '_blank')}
                  className="flex items-center p-3 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group w-full"
                >
                  <span className="font-medium">Export Data</span>
                  <ArrowUpRight className="h-4 w-4 text-gray-400 ml-auto" />
                </button>
              </div>
            </ChartCard>

            {/* Setup Instructions */}
            {!hasData && (
              <ChartCard
                title="Get Started"
                subtitle="Setup instructions"
              >
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">1. Create Supabase Project</h4>
                    <p className="text-sm text-blue-700 mb-3">Set up your database at supabase.com</p>
                    <a 
                      href="https://supabase.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                    >
                      Go to Supabase <ArrowUpRight className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">2. Run Database Schema</h4>
                    <p className="text-sm text-gray-600 mb-2">Execute the SQL from supabase-schema.sql</p>
                    <code className="text-xs bg-gray-200 px-2 py-1 rounded">npm run db:seed</code>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">3. Configure Environment</h4>
                    <p className="text-sm text-gray-600">Add your Supabase credentials to .env</p>
                  </div>
                </div>
              </ChartCard>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
