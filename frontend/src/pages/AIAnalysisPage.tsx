import React, { useState } from 'react';
import { 
  Brain, TrendingUp, Landmark, RefreshCw, AlertTriangle, 
  CheckCircle2, Star, Clock, Zap, FileText, ChevronRight, RotateCcw
} from 'lucide-react';
import api from '../services/api';

interface SupplierRecommendation {
  sku: string;
  material: string;
  quantity: number;
  supplier_name: string;
  price_per_unit: number;
  total_price: number;
  delivery_days: number;
  rating: number;
  savings: number;
}

interface AnalysisResult {
  summary: string;
  supplier_recommendations: SupplierRecommendation[];
  budget_approval: {
    approved: boolean;
    reason: string;
    total_cost: number;
  };
  potential_savings: number;
  order_quantity: number;
  confidence: number;
  execution_time_ms: number;
}

export default function AIAnalysisPage() {
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const runAnalysis = async () => {
    setLoading(true);
    setError('');
    setInfoMsg('');
    try {
      const res = await api.get('/ai/analyze');
      setResult(res.data);
    } catch (e) {
      console.error("AI Analysis failed", e);
      setError("Analysis Agent timeout. Check database connection or Gemini API limits.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    setError('');
    setInfoMsg('');
    setResult(null);
    try {
      const res = await api.post('/inventory/reset');
      setInfoMsg(res.data.message || 'Database successfully reset to demo state.');
    } catch (e) {
      console.error("Database reset failed", e);
      setError("Failed to reset database to demo state.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Brain className="w-7 h-7 text-blue-500 animate-pulse" />
            AI Replenishment Analytics
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Run real-time stock scans, compare qualified supplier quotes, and verify capital margins.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            disabled={resetting || loading}
            className="btn-secondary flex items-center gap-2"
          >
            <RotateCcw className={`w-4 h-4 text-rose-400 ${resetting ? 'animate-spin' : ''}`} />
            {resetting ? 'Resetting DB...' : 'Reset to Demo State'}
          </button>

          <button
            onClick={runAnalysis}
            disabled={loading || resetting}
            className="btn-primary flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Scanning Inventory...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                Run AI Stock Scan
              </>
            )}
          </button>
        </div>
      </div>

      {infoMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {infoMsg}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-6">
          {/* Skeleton Loaders */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="glass-card animate-pulse space-y-3">
                <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                <div className="h-8 bg-slate-800 rounded w-3/4"></div>
                <div className="h-3 bg-slate-800 rounded w-5/6"></div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card lg:col-span-2 space-y-4 animate-pulse">
              <div className="h-5 bg-slate-800 rounded w-1/4"></div>
              <div className="h-4 bg-slate-800 rounded w-full"></div>
              <div className="h-4 bg-slate-800 rounded w-full"></div>
              <div className="h-4 bg-slate-800 rounded w-5/6"></div>
            </div>
            <div className="glass-card space-y-4 animate-pulse">
              <div className="h-5 bg-slate-800 rounded w-1/3"></div>
              <div className="h-12 bg-slate-800 rounded"></div>
              <div className="h-12 bg-slate-800 rounded"></div>
            </div>
          </div>
        </div>
      )}

      {!loading && !result && (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center border border-dashed border-slate-800/80">
          <Brain className="w-16 h-16 text-slate-800 mb-4" />
          <h3 className="text-slate-300 font-bold text-base">Replenishment Audit Idle</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-sm leading-relaxed">
            Click the "Run AI Stock Scan" button above. The orchestrator will scan low stocks, audit supplier matrices, check cash flow limits, and generate an explanation.
          </p>
        </div>
      )}

      {!loading && result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Estimated Savings</span>
                <span className="text-2xl font-bold text-emerald-400 mt-2 block">
                  ${result.potential_savings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-2 block">Comparing lowest quotes to market standard</span>
            </div>

            <div className="glass-card flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Procurement Cost</span>
                <span className="text-2xl font-bold text-slate-100 mt-2 block">
                  ${result.budget_approval.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-2 block">Calculated required inventory replenishment cost</span>
            </div>

            <div className="glass-card flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Confidence Score</span>
                <span className="text-2xl font-bold text-blue-400 mt-2 block">
                  {result.confidence}%
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-2 block">Scoring algorithm confidence limit</span>
            </div>

            <div className="glass-card flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Scan Duration</span>
                <span className="text-2xl font-bold text-purple-400 mt-2 block">
                  {result.execution_time_ms.toFixed(1)} ms
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-2 block">Time taken by Python and Gemini</span>
            </div>
          </div>

          {/* Detailed Summary and Budget Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AI Summary Block */}
            <div className="glass-card lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                <Brain className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">AI Compiled Analysis</h3>
              </div>
              <div className="prose prose-invert prose-xs max-w-none text-slate-300 max-h-[300px] overflow-y-auto pr-2 space-y-3">
                {result.summary.split('\n').map((line, i) => {
                  if (line.startsWith('# ')) {
                    return <h1 key={i} className="text-base font-bold text-slate-100 pt-2">{line.replace('# ', '')}</h1>;
                  }
                  if (line.startsWith('## ')) {
                    return <h2 key={i} className="text-xs font-bold text-blue-400 pt-1.5">{line.replace('## ', '')}</h2>;
                  }
                  if (line.startsWith('- ') || line.startsWith('* ')) {
                    return <li key={i} className="ml-4 list-disc text-xs text-slate-400">{line.substring(2)}</li>;
                  }
                  const cleanLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                  return <p key={i} className="text-xs leading-relaxed text-slate-300" dangerouslySetInnerHTML={{ __html: cleanLine || '&nbsp;' }} />;
                })}
              </div>
            </div>

            {/* Budget Panel */}
            <div className="glass-card flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 mb-4">
                  <Landmark className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Capital Clearance</h3>
                </div>
                
                {result.budget_approval.approved ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      Affordable
                    </div>
                    <p className="text-xs leading-normal">
                      {result.budget_approval.reason}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                      <AlertTriangle className="w-5 h-5 shrink-0 animate-bounce" />
                      Budget Exceeded
                    </div>
                    <p className="text-xs leading-normal">
                      {result.budget_approval.reason}
                    </p>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-500 block mt-4">
                Deductions are automatically staged for operator approval.
              </span>
            </div>
          </div>

          {/* Supplier Recommendations Table */}
          <div className="glass-card overflow-hidden !p-0">
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                Recommended Procurement Actions
              </h3>
              <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold uppercase">
                {result.supplier_recommendations.length} materials detected
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-4 px-6">SKU</th>
                    <th className="py-4 px-6">Material Name</th>
                    <th className="py-4 px-6 text-right">Quantity</th>
                    <th className="py-4 px-6">Recommended Supplier</th>
                    <th className="py-4 px-6 text-right">Unit Price</th>
                    <th className="py-4 px-6 text-right">Total Cost</th>
                    <th className="py-4 px-6 text-right">Delivery Days</th>
                    <th className="py-4 px-6 text-right">QA Rating</th>
                    <th className="py-4 px-6 text-right">Est. Savings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {result.supplier_recommendations.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500">
                        No replenishment actions needed. All stocks normal.
                      </td>
                    </tr>
                  ) : (
                    result.supplier_recommendations.map((rec, i) => (
                      <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-4 px-6 font-mono font-semibold text-slate-400">{rec.sku}</td>
                        <td className="py-4 px-6 font-medium text-slate-200">{rec.material}</td>
                        <td className="py-4 px-6 text-right font-bold text-slate-100">{rec.quantity}</td>
                        <td className="py-4 px-6 font-semibold text-slate-300">{rec.supplier_name}</td>
                        <td className="py-4 px-6 text-right text-slate-300">${rec.price_per_unit.toFixed(2)}</td>
                        <td className="py-4 px-6 text-right font-bold text-slate-100">${rec.total_price.toFixed(2)}</td>
                        <td className="py-4 px-6 text-right text-slate-400">{rec.delivery_days} days</td>
                        <td className="py-4 px-6 text-right text-slate-100 font-medium">
                          <span className="inline-flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            {rec.rating.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-emerald-400">
                          {rec.savings > 0 ? `+$${rec.savings.toFixed(2)}` : '$0.00'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
