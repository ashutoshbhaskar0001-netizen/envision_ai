import React, { useEffect, useState } from 'react';
import { Cpu, RefreshCw, Activity, CheckCircle2, ShieldAlert } from 'lucide-react';
import api from '../services/api';

interface AgentState {
  name: string;
  status: string;
  role: string;
}

export default function AgentMonitorPage() {
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgentStatus = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setAgents(res.data.agent_states);
    } catch (e) {
      console.error("Error fetching agent status", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentStatus();
  }, []);

  const getAgentColor = (name: string) => {
    switch (name) {
      case 'Inventory Agent': return 'from-amber-600/20 to-amber-900/10 border-amber-800/80 text-amber-400';
      case 'Supplier Intelligence Agent': return 'from-teal-600/20 to-teal-900/10 border-teal-800/80 text-teal-400';
      case 'Budget Agent': return 'from-emerald-600/20 to-emerald-900/10 border-emerald-800/80 text-emerald-400';
      case 'Purchasing Agent': return 'from-blue-600/20 to-blue-900/10 border-blue-800/80 text-blue-400';
      case 'Reporting Agent': return 'from-purple-600/20 to-purple-900/10 border-purple-800/80 text-purple-400';
      case 'Notification Agent': return 'from-rose-600/20 to-rose-900/10 border-rose-800/80 text-rose-400';
      case 'Monitoring Agent': return 'from-indigo-600/20 to-indigo-900/10 border-indigo-800/80 text-indigo-400';
      case 'Self-Healing Agent': return 'from-fuchsia-600/20 to-fuchsia-900/10 border-fuchsia-800/80 text-fuchsia-400';
      default: return 'from-slate-650/20 to-slate-900/10 border-slate-800 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">AI Agent Runtime Monitor</h2>
          <p className="text-slate-400 text-sm mt-0.5">Real-time status check on all 9 autonomous agents cooperating in the system scope.</p>
        </div>
        <button 
          onClick={fetchAgentStatus}
          disabled={loading}
          className="btn-secondary"
        >
          <RefreshCw className={`w-4 h-4 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
          Refresh Agent Metrics
        </button>
      </div>

      {/* Agents Grid */}
      {loading ? (
        <div className="flex justify-center py-12 text-slate-500 text-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500 mr-2" /> Loading agent logs...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, index) => (
            <div 
              key={index} 
              className={`glass-card bg-gradient-to-br border flex flex-col justify-between hover:shadow-2xl transition-all duration-300 ${getAgentColor(agent.name)}`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 shrink-0" />
                    <span className="font-bold text-xs text-slate-100 uppercase tracking-wide">{agent.name}</span>
                  </div>
                  <span className="badge-success">
                    {agent.status}
                  </span>
                </div>
                
                <p className="text-xs text-slate-400 leading-relaxed font-medium">{agent.role}</p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-850 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Health: 100%
                </span>
                <span>Last execution: Just now</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
