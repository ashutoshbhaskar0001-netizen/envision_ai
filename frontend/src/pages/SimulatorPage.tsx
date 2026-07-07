import React, { useEffect, useState } from 'react';
import { Play, CheckCircle2, XCircle, Users, Cpu, ArrowDownToLine, RefreshCw, Layers } from 'lucide-react';
import api from '../services/api';

interface Supplier {
  id: number;
  name: string;
  material: string;
  price: number;
}

interface Step {
  agent_name: string;
  action: string;
  details: string;
  timestamp: string;
}

interface SimulationResult {
  success: boolean;
  decision: string;
  steps: Step[];
  savings_calculated: number;
  budget_impact: {
    monthly_budget: number;
    fixed_expenses: number;
    remaining_budget_before: number;
    remaining_budget_after: number;
    purchase_cost: number;
  };
  recommendation: string;
}

export default function SimulatorPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  // Form states
  const [material, setMaterial] = useState('');
  const [quantity, setQuantity] = useState(100);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(0);
  const [price, setPrice] = useState(0.0);

  // Load suppliers and set defaults
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await api.get('/suppliers');
        setSuppliers(res.data);
        if (res.data.length > 0) {
          // Group by material, set default material
          const uniqueMaterials = Array.from(new Set(res.data.map((s: Supplier) => s.material))) as string[];
          setMaterial(uniqueMaterials[0]);
        }
      } catch (e) {
        console.error("Error loading simulation details", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Update supplier dropdown when material changes
  const filteredSuppliers = suppliers.filter(s => s.material === material);

  useEffect(() => {
    if (filteredSuppliers.length > 0) {
      const defaultSupplier = filteredSuppliers[0];
      setSelectedSupplierId(defaultSupplier.id);
      setPrice(defaultSupplier.price);
    }
  }, [material]);

  // Update default price when supplier changes
  useEffect(() => {
    const activeSup = filteredSuppliers.find(s => s.id === Number(selectedSupplierId));
    if (activeSup) {
      setPrice(activeSup.price);
    }
  }, [selectedSupplierId]);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    setResult(null);
    
    try {
      const res = await api.post('/simulator/run', {
        material,
        quantity: Number(quantity),
        supplier_id: Number(selectedSupplierId),
        price: Number(price)
      });
      setResult(res.data);
    } catch (e) {
      console.error("Simulation request failed", e);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
        <span>Loading simulation matrices...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100">Multi-Agent Procurement Simulator</h2>
        <p className="text-slate-400 text-sm mt-0.5">Test purchasing impacts on budgets, check alternative supplier pricing, and visualize agent coordination flows.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Parameters Form */}
        <div className="glass-card h-fit space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <Layers className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Simulation Variables</h3>
          </div>

          <form onSubmit={handleSimulate} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold">Material Code</label>
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {Array.from(new Set(suppliers.map(s => s.material))).map((m, i) => (
                  <option key={i} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold">Quantity Required</label>
              <input 
                type="number" 
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold">Target Supplier</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {filteredSuppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold">Simulated Price per Unit ($)</label>
              <input 
                type="number" 
                step="0.01"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button 
              type="submit"
              disabled={simulating}
              className="btn-primary w-full mt-2"
            >
              <Play className={`w-4 h-4 ${simulating ? 'animate-pulse' : ''}`} />
              {simulating ? 'Running Simulator...' : 'Run Simulation'}
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="glass-card lg:col-span-2 min-h-[400px] flex flex-col justify-between">
          {simulating ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-xs">Agents are negotiating purchase constraints...</p>
            </div>
          ) : !result ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
              <Cpu className="w-12 h-12 text-slate-700 mb-3" />
              <h4 className="font-semibold text-sm text-slate-400">Simulation Output Idle</h4>
              <p className="text-xs max-w-xs mt-1">Adjust parameters on the left and run simulation to trigger the agent workflow.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Approval status banner */}
              <div className={`p-4 rounded-xl flex items-center justify-between gap-4 border ${
                result.success 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                <div className="flex items-center gap-3">
                  {result.success ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wide">Procurement Decision: {result.decision}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{result.recommendation}</p>
                  </div>
                </div>
              </div>

              {/* Budget impact stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
                  <span className="text-slate-500 font-semibold">Total Order Cost:</span>
                  <div className="font-bold text-slate-200 text-sm">${result.budget_impact.purchase_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
                  <span className="text-slate-500 font-semibold">Simulated Balance After:</span>
                  <div className={`font-bold text-sm ${result.success ? 'text-emerald-400' : 'text-slate-300'}`}>
                    ${result.budget_impact.remaining_budget_after.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
                  <span className="text-slate-500 font-semibold">Calculated Savings:</span>
                  <div className="font-bold text-purple-400 text-sm">${result.savings_calculated.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
              </div>

              {/* Collaborative agent logs timeline */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  Multi-Agent Orchestration Log
                </h3>
                
                <div className="space-y-4 pl-4 border-l border-slate-800">
                  {result.steps.map((step, idx) => (
                    <div key={idx} className="relative space-y-1">
                      {/* Node point */}
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-slate-950"></span>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">{step.agent_name}</span>
                        <span className="text-[10px] bg-slate-850 px-2 py-0.5 text-slate-400 rounded-full border border-slate-800">{step.action}</span>
                        <span className="text-[10px] text-slate-500 ml-auto">{step.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-400 pl-0.5">{step.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
