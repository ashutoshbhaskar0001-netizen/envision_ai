import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import SuppliersPage from './pages/SuppliersPage';
import BudgetPage from './pages/BudgetPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import SimulatorPage from './pages/SimulatorPage';
import AgentMonitorPage from './pages/AgentMonitorPage';
import ActivityPage from './pages/ActivityPage';
import SelfHealingPage from './pages/SelfHealingPage';
import ReportsPage from './pages/ReportsPage';
import AIAnalysisPage from './pages/AIAnalysisPage';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/agents" element={<AgentMonitorPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/self-healing" element={<SelfHealingPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/analysis" element={<AIAnalysisPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}
