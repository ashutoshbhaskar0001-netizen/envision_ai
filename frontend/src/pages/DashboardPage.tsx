import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Package, AlertTriangle, Landmark, TrendingUp, Cpu, 
  ArrowRight, ShieldAlert, HeartPulse, RefreshCw, Layers
} from 'lucide-react';
import api from '../services/api';
import StatsCard from '../components/StatsCard';

interface DashboardStats {
  inventory_value: number;
  low_stock_count: number;
  monthly_budget: number;
  budget_remaining: number;
  savings_generated: number;
  purchase_orders_count: number;
  approved_orders_count: number;
  recent_decisions: any[];
  system_health: {
    cpu_usage: number;
    memory_usage: number;
    db_status: string;
    api_status: string;
    response_time_ms: number;
  };
  agent_states: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggeringCheck, setTriggeringCheck] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (e) {
      console.error("Error fetching dashboard stats", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Poll stats every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const triggerInventoryCheck = async () => {
    setTriggeringCheck(true);
    try {
      await api.post('/inventory/check');
      fetchStats();
    } catch (e) {
      console.error("Error triggering check", e);
    } finally {
      setTriggeringCheck(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
        <span>Loading enterprise intelligence...</span>
      </div>
    );
  }

  // Pre-calculate expense slices for the Pie Chart
  const usedBudget = stats.monthly_budget - stats.budget_remaining;
  const budgetPieData = [
    { name: 'Remaining Capital', value: stats.budget_remaining, color: '#3b82f6' },
    { name: 'Spent & Committed', value: usedBudget, color: '#f43f5e' }
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">ENVISION AI ERP</h2>
          <p className="text-slate-400 text-sm mt-0.5">Autonomous orchestrator agent collaborating to optimize supply chain activities.</p>
        </div>
        <button 
          onClick={triggerInventoryCheck}
          disabled={triggeringCheck}
          className="btn-primary"
        >
          <Cpu className={`w-4 h-4 ${triggeringCheck ? 'animate-spin' : ''}`} />
          {triggeringCheck ? 'Analyzing Inventory...' : 'Trigger Inventory Agent Check'}
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Inventory Valuation" 
          value={`$${stats.inventory_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext="Total stock asset value in warehouse"
          icon={Package}
          iconColorClass="text-blue-500 bg-blue-500/10"
        />
        <StatsCard 
          title="Low Stock Alarms" 
          value={stats.low_stock_count}
          subtext="Items below reorder point"
          icon={AlertTriangle}
          iconColorClass="text-amber-500 bg-amber-500/10"
          trend={stats.low_stock_count > 0 ? 'down' : 'neutral'}
          trendText={stats.low_stock_count > 0 ? 'Critical' : 'Stable'}
        />
        <StatsCard 
          title="Remaining Budget" 
          value={`$${stats.budget_remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext={`Monthly Budget: $${stats.monthly_budget.toLocaleString()}`}
          icon={Landmark}
          iconColorClass="text-emerald-500 bg-emerald-500/10"
          trend="up"
          trendText="Audited"
        />
        <StatsCard 
          title="Savings Generated" 
          value={`$${stats.savings_generated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext={`Across ${stats.approved_orders_count} approved orders`}
          icon={TrendingUp}
          iconColorClass="text-purple-500 bg-purple-500/10"
          trend="up"
          trendText="AI Optimized"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Allocation Pie */}
        <div className="glass-card flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Capital Health Allocation</h3>
            <p className="text-xs text-slate-500 mt-1">Status of monthly budget usage and capital reserves.</p>
          </div>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={budgetPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {budgetPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Amount']} 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Agent Decisions */}
        <div className="glass-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Recent Autonomous AI Decisions</h3>
              <p className="text-xs text-slate-500 mt-1">Audit log of key purchasing and logic actions taken by the team.</p>
            </div>
            <Link to="/activity" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View All Activity <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-4">
            {stats.recent_decisions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No autonomous decisions recorded yet. Run an Inventory check to trigger decisions!
              </div>
            ) : (
              stats.recent_decisions.map(d => (
                <div key={d.id} className="p-4 bg-slate-900/40 border border-slate-800 rounded-lg flex justify-between items-start gap-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-600/10 p-2 rounded-lg text-blue-400 mt-0.5">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">{d.agent_name}</span>
                      <h4 className="text-xs font-semibold text-slate-200 mt-0.5">{d.action_type}</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        {d.action_type === 'Simulation Run' 
                          ? `Simulated ordering ${d.decision_details.quantity} x ${d.decision_details.material} from ${d.decision_details.supplier}. Status: ${d.decision_details.approved ? 'Approved' : 'Rejected'}.`
                          : d.action_type === 'Purchase Order Created'
                            ? `Drafted PO #${d.decision_details.po_id} for SKU '${d.decision_details.sku}' (${d.decision_details.quantity} units). Status: ${d.decision_details.status}.`
                            : JSON.stringify(d.decision_details)
                        }
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0 font-medium">
                    {new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Agents and Health grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Diagnostics */}
        <div className="glass-card">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-4">System Operational Diagnostics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs text-slate-400">Database Engine</span>
              <span className={`text-xs font-bold ${
                stats.system_health.db_status === 'Healthy' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {stats.system_health.db_status}
              </span>
            </div>
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs text-slate-400">Gemini LLM Connectivity</span>
              <span className={`text-xs font-bold ${
                stats.system_health.api_status === 'Healthy' ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {stats.system_health.api_status === 'Healthy' ? 'Connected (gemini-2.5-flash)' : 'Offline/Fallback Mode'}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs text-slate-400">Mean REST Response Time</span>
              <span className="text-xs font-bold text-slate-200">
                {stats.system_health.response_time_ms.toFixed(1)} ms
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>System Memory Load</span>
                <span>{stats.system_health.memory_usage}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: `${stats.system_health.memory_usage}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Agent Grid Summary */}
        <div className="glass-card lg:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-4">Active Business Agents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.agent_states.slice(0, 4).map((a, i) => (
              <div key={i} className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600/10 p-2 rounded-lg text-blue-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{a.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{a.role}</p>
                  </div>
                </div>
                <span className="badge-success shrink-0">
                  {a.status}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Link to="/agents" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Manage All 9 Agents <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
