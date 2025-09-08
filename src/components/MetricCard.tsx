'use client';

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'red' | 'orange';
  format?: 'currency' | 'percentage' | 'number';
}

const colorClasses = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  purple: 'from-purple-500 to-purple-600',
  red: 'from-red-500 to-red-600',
  orange: 'from-orange-500 to-orange-600',
};

const bgColorClasses = {
  blue: 'bg-blue-50',
  green: 'bg-green-50',
  purple: 'bg-purple-50',
  red: 'bg-red-50',
  orange: 'bg-orange-50',
};

export default function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color,
  format = 'number'
}: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (format === 'currency') {
      return typeof val === 'number' ? `$${val.toLocaleString()}` : val;
    }
    if (format === 'percentage') {
      return typeof val === 'number' ? `${val.toFixed(1)}%` : val;
    }
    return typeof val === 'number' ? val.toLocaleString() : val;
  };

  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {formatValue(value)}
          </p>
          {change !== undefined && (
            <div className="flex items-center space-x-1">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : isNegative ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : null}
              <span className={`text-sm font-medium ${
                isPositive ? 'text-green-600' : 
                isNegative ? 'text-red-600' : 
                'text-gray-500'
              }`}>
                {change > 0 ? '+' : ''}{change?.toFixed(1)}%
              </span>
              {changeLabel && (
                <span className="text-sm text-gray-500">vs last month</span>
              )}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${bgColorClasses[color]}`}>
          <Icon className={`h-6 w-6 bg-gradient-to-r ${colorClasses[color]} bg-clip-text text-transparent`} />
        </div>
      </div>
    </div>
  );
}
