import React, { useEffect, useState } from 'react';
import { HeartPulse, ShieldAlert, Cpu, Sparkles, RefreshCw, CheckCircle2, AlertTriangle, Terminal } from 'lucide-react';
import api from '../services/api';

interface ErrorLog {
  id: number;
  timestamp: string;
  error_message: string;
  stack_trace: string;
  code_context: string | null;
  resolved: boolean;
  resolution_details: string | null;
}

export default function SelfHealingPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [demoResult, setDemoResult] = useState<any>(null);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/self-healing/logs');
      setLogs(res.data);
      if (res.data.length > 0 && !selectedLog) {
        setSelectedLog(res.data[0]);
      }
    } catch (e) {
      console.error("Error fetching healing logs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const triggerSyntheticError = async () => {
    setTriggering(true);
    setDemoResult(null);
    try {
      const res = await api.post('/self-healing/trigger-error');
      setDemoResult(res.data);
      fetchLogs(); // refresh list
    } catch (e) {
      console.error("Error triggering test error", e);
    } finally {
      setTriggering(false);
    }
  };

  const getStatusIndicator = (resolved: boolean) => {
    return resolved ? (
      <span className="badge-success flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" /> Recovered Automatically
      </span>
    ) : (
      <span className="badge-danger flex items-center gap-1">
        <AlertTriangle className="w-3 h-3 animate-pulse" /> Manual Intervention Required
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-fuchsia-400" />
            Self-Healing Agent Panel
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">Autonomous exception tracking, LLM-based root-cause analysis, and automatic hot-patch compilation.</p>
        </div>
        <button 
          onClick={triggerSyntheticError}
          disabled={triggering}
          className="btn-primary bg-fuchsia-600 hover:bg-fuchsia-500 hover:shadow-fuchsia-500/20"
        >
          <Sparkles className={`w-4 h-4 ${triggering ? 'animate-spin' : ''}`} />
          {triggering ? 'Compiling Hot Patch...' : 'Trigger Synthetic Error Test'}
        </button>
      </div>

      {demoResult && (
        <div className={`p-4 rounded-xl border space-y-2 animate-in fade-in zoom-in-95 duration-200 ${
          demoResult.execution_result !== undefined 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
            <Terminal className="w-4 h-4" />
            Simulation Run Complete: {demoResult.message}
          </div>
          <div className="text-xs text-slate-300">
            Target Operation: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-rose-400">divide_numbers(10, 0)</code>
          </div>
          {demoResult.error_details && (
            <div className="text-xs text-slate-400 space-y-1 mt-1">
              <div>Captured Exception: <span className="text-rose-400 font-semibold">{demoResult.error_details.error_message}</span></div>
              <div>Recovery Status: <span className="text-slate-200 font-bold">{demoResult.error_details.resolution_details}</span></div>
              {demoResult.execution_result !== undefined && (
                <div>Dynamic Retry Result: <span className="text-emerald-400 font-bold">{demoResult.execution_result}</span> (Zero division was bypassed safely)</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Exception Log list */}
        <div className="glass-card flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-500" /> Intercepted Exceptions
            </h3>
            
            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2 divide-y divide-slate-800/80">
              {loading ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-500 mr-2" /> Querying exception database...
                </div>
              ) : logs.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No exceptions caught in the system. Use the "Trigger Synthetic Error Test" button above to register a demo!
                </div>
              ) : (
                logs.map((log) => (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all space-y-2 mt-2 first:mt-0 ${
                      selectedLog?.id === log.id 
                        ? 'bg-slate-900 border-fuchsia-500/40 shadow-lg' 
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      {getStatusIndicator(log.resolved)}
                    </div>
                    <h4 className="text-xs font-bold text-slate-200 truncate">{log.error_message}</h4>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Selected Log Inspector */}
        <div className="glass-card lg:col-span-2 min-h-[400px]">
          {!selectedLog ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
              Select an error to inspect traceback and proposed corrections.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Log Header */}
              <div className="border-b border-slate-800/80 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <h3 className="font-bold text-sm text-slate-200">{selectedLog.error_message}</h3>
                  {getStatusIndicator(selectedLog.resolved)}
                </div>
                <span className="text-[10px] text-slate-500">Timestamp: {new Date(selectedLog.timestamp).toLocaleString()}</span>
              </div>

              {/* Source code block */}
              {selectedLog.code_context && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Failing Function Source Code</span>
                  <pre className="bg-slate-950 p-4 rounded-lg font-mono text-[11px] text-rose-300 border border-rose-500/10 overflow-x-auto">
                    {selectedLog.code_context}
                  </pre>
                </div>
              )}

              {/* Gemini Patch details */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-400 animate-pulse" />
                  AI Self-Healing Resolution & Patch suggestions
                </span>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-3">
                  <div>
                    <span className="font-bold text-slate-400">Diagnosis Details:</span>
                    <p className="text-slate-300 mt-1">{selectedLog.resolution_details || 'Patch generated. Saving corrections to patch.py.'}</p>
                  </div>
                </div>
              </div>

              {/* Traceback summary */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Complete Traceback</span>
                <details className="cursor-pointer group">
                  <summary className="text-[10px] text-slate-500 font-bold group-open:text-blue-400 transition-colors uppercase tracking-wider">
                    Expand Full Stack trace
                  </summary>
                  <pre className="bg-slate-950 p-4 mt-2 rounded-lg font-mono text-[10px] text-slate-400 border border-slate-800 max-h-56 overflow-y-auto">
                    {selectedLog.stack_trace}
                  </pre>
                </details>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
