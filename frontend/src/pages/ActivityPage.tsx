import React, { useEffect, useState } from 'react';
import { Activity, Clock, ShieldAlert, Cpu, Landmark, ShieldCheck, FileText, Bell, RefreshCw } from 'lucide-react';
import api from '../services/api';

interface AgentLog {
  id: number;
  timestamp: string;
  agent_name: string;
  log_level: string;
  message: string;
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/monitoring/agent-logs');
      setLogs(res.data);
    } catch (e) {
      console.error("Error fetching agent logs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getAgentIcon = (name: string) => {
    switch (name) {
      case 'Inventory Agent': return <Cpu className="w-4 h-4 text-amber-400" />;
      case 'Supplier Intelligence Agent': return <ShieldCheck className="w-4 h-4 text-teal-400" />;
      case 'Budget Agent': return <Landmark className="w-4 h-4 text-emerald-400" />;
      case 'Purchasing Agent': return <FileText className="w-4 h-4 text-blue-400" />;
      case 'Reporting Agent': return <Activity className="w-4 h-4 text-purple-400" />;
      case 'Notification Agent': return <Bell className="w-4 h-4 text-rose-400" />;
      case 'Self-Healing Agent': return <ShieldAlert className="w-4 h-4 text-fuchsia-400" />;
      default: return <Cpu className="w-4 h-4 text-slate-400" />;
    }
  };

  const getLogLevelClass = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR': return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      case 'WARNING': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      default: return 'bg-slate-800 border-slate-700 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">AI Activity & Collaboration Timeline</h2>
          <p className="text-slate-400 text-sm mt-0.5">Chronological ledger of autonomous communications, evaluations, and decisions.</p>
        </div>
        <button 
          onClick={fetchLogs}
          className="btn-secondary"
        >
          <RefreshCw className="w-4 h-4 text-blue-400" /> Refresh Timeline
        </button>
      </div>

      {/* Timeline Section */}
      <div className="glass-card">
        {loading ? (
          <div className="flex justify-center py-12 text-slate-500 text-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-500 mr-2" />
            Loading timeline...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No agent activities logged. Click "Trigger Inventory Agent Check" on ENVISION AI ERP to start!
          </div>
        ) : (
          <div className="relative pl-6 border-l border-slate-800 space-y-6">
            {logs.map((log) => (
              <div key={log.id} className="relative space-y-1.5 animate-in fade-in slide-in-from-left-4 duration-200">
                {/* Node connector */}
                <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg">
                  {getAgentIcon(log.agent_name)}
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">{log.agent_name}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded border font-semibold ${getLogLevelClass(log.log_level)}`}>
                    {log.log_level}
                  </span>
                  
                  <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 ml-auto">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 max-w-4xl">{log.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
