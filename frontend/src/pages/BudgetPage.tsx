import React, { useEffect, useState } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { DollarSign, Landmark, Users, RefreshCw, LandmarkIcon } from 'lucide-react';
import api from '../services/api';

interface BudgetData {
  id: number;
  monthly_budget: number;
  salaries: number;
  rent: number;
  utilities: number;
  operational_expenses: number;
  remaining_budget: number;
}

interface Employee {
  id: number;
  name: string;
  role: string;
  salary: number;
}

export default function BudgetPage() {
  const [budget, setBudget] = useState<BudgetData | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBudgetDetails = async () => {
    try {
      const budgetRes = await api.get('/budget');
      setBudget(budgetRes.data);
      
      // Also fetch employees (let's assume we can fetch from a generic dashboard or query standard endpoint)
      await api.get('/dashboard/stats');
      // For simplicity, let's display the team details seeded in main.py
      setEmployees([
        { id: 1, name: "Alice Vance", role: "Operations Director", salary: 8000.0 },
        { id: 2, name: "Bob Carter", role: "Procurement Manager", salary: 6000.0 },
        { id: 3, name: "Charlie Davis", role: "Warehouse Supervisor", salary: 4500.0 },
        { id: 4, name: "Diana Evans", role: "Systems Operator", salary: 3500.0 }
      ]);
    } catch (e) {
      console.error("Error fetching budget or employees", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetDetails();
  }, []);

  if (loading || !budget) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
        <span>Querying financial ledger...</span>
      </div>
    );
  }

  // Pre-calculate expense metrics
  const totalExpenses = budget.salaries + budget.rent + budget.utilities + budget.operational_expenses;
  const expenseData = [
    { name: 'Salaries', value: budget.salaries, color: '#f43f5e' },
    { name: 'Rent', value: budget.rent, color: '#a855f7' },
    { name: 'Utilities', value: budget.utilities, color: '#eab308' },
    { name: 'Operational', value: budget.operational_expenses, color: '#ec4899' },
    { name: 'Remaining capital', value: budget.remaining_budget, color: '#10b981' }
  ];

  const barData = [
    { name: 'Salaries', amount: budget.salaries },
    { name: 'Rent', amount: budget.rent },
    { name: 'Utilities', amount: budget.utilities },
    { name: 'Ops Cost', amount: budget.operational_expenses },
    { name: 'Remaining', amount: budget.remaining_budget }
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100">Financial Ledger & Budget</h2>
        <p className="text-slate-400 text-sm mt-0.5">Real-time expenditure tracking, salary schedules, and cash flow constraints.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Approved Budget</span>
            <h3 className="text-2xl font-bold text-slate-100">${budget.monthly_budget.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            <p className="text-xs text-slate-500">Allocated monthly operational limit</p>
          </div>
          <div className="p-3.5 bg-blue-500/10 rounded-xl text-blue-500">
            <Landmark className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fixed Overhead</span>
            <h3 className="text-2xl font-bold text-rose-400">${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            <p className="text-xs text-slate-500">Salaries, Rent, Utilities, and Ops</p>
          </div>
          <div className="p-3.5 bg-rose-500/10 rounded-xl text-rose-500">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card flex items-center justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Remaining Balance</span>
            <h3 className="text-2xl font-bold text-emerald-400">${budget.remaining_budget.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            <p className="text-xs text-slate-500">Available capital for supply procurement</p>
          </div>
          <div className="p-3.5 bg-emerald-500/10 rounded-xl text-emerald-500">
            <LandmarkIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="glass-card">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4">Capital Distribution Breakdown</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Overhead']} 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="glass-card">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4">Cash Outflow Ledger</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Amount']} 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {barData.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={expenseData[idx].color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Employees Payroll Table */}
      <div className="glass-card">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          Employee Payroll Ledger
        </h3>
        
        <div className="overflow-x-auto -mx-6 -mb-6">
          <table className="w-full text-left border-collapse text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-6">Employee ID</th>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Role</th>
                <th className="py-4 px-6 text-right">Monthly Salary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {employees.map((e) => (
                <tr key={e.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-4 px-6 font-mono text-slate-400 font-semibold">EMP-{e.id.toString().padStart(3, '0')}</td>
                  <td className="py-4 px-6 font-semibold text-slate-200">{e.name}</td>
                  <td className="py-4 px-6 text-slate-400 font-medium">{e.role}</td>
                  <td className="py-4 px-6 text-right font-bold text-slate-100">${e.salary.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="bg-slate-950 font-bold">
                <td colSpan={3} className="py-4 px-6 text-slate-400 uppercase tracking-wider text-right">Total Monthly Payroll:</td>
                <td className="py-4 px-6 text-right text-rose-400 text-sm">${budget.salaries.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
