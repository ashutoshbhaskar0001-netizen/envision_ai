import React, { useEffect, useState, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShieldCheck, DollarSign, 
  FileText, Play, Cpu, Activity, HeartPulse, FileBarChart2,
  Bell, Check, RefreshCw, X, ShieldAlert, Brain
} from 'lucide-react';
import api from '../services/api';

interface Notification {
  id: number;
  timestamp: string;
  level: string;
  category: string;
  message: string;
  read: boolean;
}

interface HealthInfo {
  cpu_usage: number;
  memory_usage: number;
  db_status: string;
  api_status: string;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [health, setHealth] = useState<HealthInfo>({ cpu_usage: 0, memory_usage: 0, db_status: 'Healthy', api_status: 'Healthy' });
  const [loadingHealth, setLoadingHealth] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n: Notification) => !n.read).length);
    } catch (e) {
      console.error("Error fetching notifications", e);
    }
  };

  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await api.get('/monitoring/health');
      setHealth(res.data);
    } catch (e) {
      console.error("Error fetching health", e);
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchHealth();
    
    // Poll notifications every 5 seconds
    const interval = setInterval(() => {
      fetchNotifications();
      fetchHealth();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Close notifications dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = async () => {
    try {
      await api.post('/notifications/clear');
      setNotifications([]);
      setUnreadCount(0);
      setShowNotifications(false);
    } catch (e) {
      console.error("Error clearing notifications", e);
    }
  };

  const menuItems = [
    { path: '/', label: 'ENVISION AI ERP', icon: LayoutDashboard },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/suppliers', label: 'Suppliers', icon: ShieldCheck },
    { path: '/budget', label: 'Budget & Capital', icon: DollarSign },
    { path: '/purchase-orders', label: 'Purchase Orders', icon: FileText },
    { path: '/simulator', label: 'Purchase Simulator', icon: Play },
    { path: '/analysis', label: 'AI Analysis', icon: Brain },
    { path: '/reports', label: 'Reports & Export', icon: FileBarChart2 },
    { path: '/activity', label: 'AI Activity Timeline', icon: Activity },
    { path: '/agents', label: 'Agent Monitor', icon: Cpu },
    { path: '/self-healing', label: 'Self-Healing System', icon: HeartPulse },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-20">
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 tracking-wide text-sm">ENVISION AI ERP</h1>
            <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Multi-Agent Business AI</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
          {menuItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Block */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow">
              OP
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">System Operator</p>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Active Mode
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 z-10">
          {/* Health Indicators */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Database:</span>
              <span className={`text-xs font-bold ${
                health.db_status === 'Healthy' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {health.db_status}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Gemini API:</span>
              <span className={`text-xs font-bold ${
                health.api_status === 'Healthy' ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {health.api_status === 'Healthy' ? 'Connected' : 'Offline / Fallback'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-400">CPU:</span>
                <span className="text-xs font-bold text-slate-200">{health.cpu_usage}%</span>
              </div>
              <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${health.cpu_usage}%` }}></div>
              </div>
            </div>
          </div>

          {/* User actions / alerts */}
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchHealth} 
              disabled={loadingHealth}
              className="p-2 text-slate-400 hover:text-slate-200 transition-colors bg-slate-800 rounded-lg hover:bg-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${loadingHealth ? 'animate-spin' : ''}`} />
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-all relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-30">
                  <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200">System Notifications</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={markAllRead}
                        className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                      >
                        <Check className="w-3 h-3" /> Mark Read
                      </button>
                      <button 
                        onClick={clearNotifications}
                        className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium"
                      >
                        <X className="w-3 h-3" /> Clear
                      </button>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">No active alerts</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-4 hover:bg-slate-800/40 transition-colors ${!n.read ? 'bg-slate-800/20' : ''}`}>
                          <div className="flex items-start gap-2.5">
                            {n.level === 'ERROR' ? (
                              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            ) : n.level === 'WARNING' ? (
                              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            ) : (
                              <Cpu className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide">{n.category.replace('_', ' ')}</p>
                              <p className="text-xs text-slate-400 mt-0.5 break-words">{n.message}</p>
                              <span className="text-[9px] text-slate-500 block mt-1">{n.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
