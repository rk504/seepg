'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  CreditCard, 
  Users, 
  AlertTriangle, 
  Download,
  Settings,
  Home
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/', icon: Home },
  { name: 'Promo Codes', href: '/dashboard/codes', icon: CreditCard },
  { name: 'Owners', href: '/dashboard/owners', icon: Users },
  { name: 'Leakage', href: '/dashboard/leakage', icon: AlertTriangle },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Logo */}
      <div className="flex items-center px-6 py-8">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">PromoIntel</h1>
            <p className="text-xs text-slate-400">AI Analytics</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-700">
        <button className="w-full flex items-center px-3 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200">
          <Download className="mr-3 h-5 w-5 text-slate-400" />
          Export Data
        </button>
        <button className="w-full flex items-center px-3 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200 mt-2">
          <Settings className="mr-3 h-5 w-5 text-slate-400" />
          Settings
        </button>
      </div>
    </div>
  );
}
