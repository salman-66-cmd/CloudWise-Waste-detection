import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  Trash2,
  DollarSign,
  Lightbulb,
  Bell,
  FileBarChart,
  Settings,
  User,
  CloudLightning,
  Sparkles,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  potentialSavings?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, potentialSavings = 384.50 }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Cloud Resources', path: '/resources', icon: Server },
    { name: 'Waste Detection', path: '/waste', icon: Trash2 },
    { name: 'Cost Analytics', path: '/cost', icon: DollarSign },
    { name: 'Recommendations', path: '/recommendations', icon: Lightbulb },
    { name: 'Alerts', path: '/alerts', icon: Bell },
    { name: 'Reports', path: '/reports', icon: FileBarChart },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'User Profile', path: '/profile', icon: User },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#090d16] border-r border-[#1e293b] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <CloudLightning className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight bg-linear-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                CloudWise
              </div>
              <div className="text-[10px] tracking-wider uppercase font-semibold text-slate-400">
                INTELLIGENT CLOUD OPS
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-linear-to-r from-blue-600/20 to-indigo-600/10 text-blue-400 border border-blue-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#131b2e]'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Total Savings Card at bottom */}
        <div className="p-4 border-t border-[#1e293b] space-y-3">
          <div className="p-3.5 rounded-xl bg-linear-to-br from-[#121a2d] to-[#18233c] border border-blue-500/20 relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <Sparkles className="w-4 h-4 text-cyan-400/50" />
            </div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              POTENTIAL SAVINGS
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              ${potentialSavings.toFixed(2)}
              <span className="text-xs font-normal text-slate-400 ml-1">/ mo</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Optimization ready
            </div>
          </div>

          {/* User profile & logout */}
          <div className="flex items-center justify-between px-2 pt-1 text-xs text-slate-400">
            <div className="truncate max-w-[140px]">
              <span className="text-slate-300 font-medium">{user?.full_name || 'Admin'}</span>
              <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-md hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
