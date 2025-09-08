'use client';

import { LucideIcon } from 'lucide-react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export default function ChartCard({ 
  title, 
  subtitle, 
  icon: Icon, 
  children, 
  className = '' 
}: ChartCardProps) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-2 bg-gray-50 rounded-lg">
            <Icon className="h-5 w-5 text-gray-600" />
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
