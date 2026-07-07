import React, { useState } from 'react';
import { FileBarChart2, FileText, Download, Play, RefreshCw, Sparkles } from 'lucide-react';
import api from '../services/api';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('executive');
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    setMarkdown('');
    try {
      const res = await api.get(`/reports/markdown?type=${reportType}`);
      setMarkdown(res.data.report_markdown);
    } catch (e) {
      console.error("Error generating report view", e);
      setMarkdown("Failed to retrieve report data from the backend server.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      // Direct window location trigger or fetch as blob
      const response = await api.get(`/reports/pdf?type=${reportType}`, {
        responseType: 'blob'
      });
      
      // Determine file extension based on response content type
      const contentType = String(response.headers['content-type'] || '');
      const ext = contentType.includes('html') ? 'html' : 'pdf';
      
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ai_erp_${reportType}_report.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (e) {
      console.error("Error downloading report pdf", e);
    } finally {
      setDownloading(false);
    }
  };

  const reportOptions = [
    { type: 'executive', name: 'Executive Summary', desc: 'Overview of global operations, budget allocation, and low stock alarms.' },
    { type: 'budget', name: 'Financial & Budget Report', desc: 'Outlines cash flow, overhead expenditures, and capital margins.' },
    { type: 'inventory', name: 'Inventory Valuation Report', desc: 'Details stock assets, reorder counts, and overstock thresholds.' },
    { type: 'suppliers', name: 'Supplier Intelligence Audit', desc: 'Compares delivery estimates, standard prices, and ratings.' },
    { type: 'weekly', name: 'Weekly Operational Report', desc: 'A short weekly recap of procurement logs and agent decisions.' },
    { type: 'monthly', name: 'Monthly Executive Report', desc: 'Detailed monthly business forecast and supply recommendations.' },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <FileBarChart2 className="w-6 h-6 text-purple-400" />
          Enterprise Reports Center
        </h2>
        <p className="text-slate-400 text-sm mt-0.5">Autonomous compilations of operational activity. Narratives are compiled by Gemini based on python math checks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Report Selector Card */}
        <div className="glass-card h-fit space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <FileText className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Available Templates</h3>
          </div>

          <div className="space-y-3.5">
            {reportOptions.map((opt) => (
              <button
                key={opt.type}
                onClick={() => setReportType(opt.type)}
                className={`w-full text-left p-3.5 rounded-lg border transition-all space-y-1 ${
                  reportType === opt.type 
                    ? 'bg-slate-900 border-purple-500/40 shadow-lg' 
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60'
                }`}
              >
                <h4 className="text-xs font-bold text-slate-200">{opt.name}</h4>
                <p className="text-[10px] text-slate-500 leading-normal">{opt.desc}</p>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800 flex gap-3">
            <button
              onClick={generateReport}
              disabled={loading}
              className="btn-primary bg-purple-600 hover:bg-purple-500 hover:shadow-purple-500/20 flex-1 text-xs"
            >
              <Play className="w-3.5 h-3.5" />
              Generate View
            </button>
            <button
              onClick={downloadPdf}
              disabled={downloading}
              className="btn-secondary flex-1 text-xs border-purple-900/40 hover:bg-purple-950/10 text-purple-400 hover:text-purple-300 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Report View Panel */}
        <div className="glass-card lg:col-span-2 min-h-[400px] flex flex-col justify-between">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
              <p className="text-xs">Reporting Agent is compiling metrics & summarizing narratives...</p>
            </div>
          ) : !markdown ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
              <FileBarChart2 className="w-12 h-12 text-slate-700 mb-3" />
              <h4 className="font-semibold text-sm text-slate-400">Report Preview Empty</h4>
              <p className="text-xs max-w-xs mt-1">Select a template on the left and click "Generate View" to run the LLM compiler.</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Preview Compiled Narrative
                </span>
              </div>
              <div className="prose prose-invert prose-xs max-w-none text-slate-300 max-h-[500px] overflow-y-auto pr-2 space-y-4">
                {markdown.split('\n').map((line, i) => {
                  if (line.startsWith('# ')) {
                    return <h1 key={i} className="text-lg font-bold text-slate-100 pt-3">{line.replace('# ', '')}</h1>;
                  }
                  if (line.startsWith('## ')) {
                    return <h2 key={i} className="text-sm font-bold text-purple-400 pt-2">{line.replace('## ', '')}</h2>;
                  }
                  if (line.startsWith('- ') || line.startsWith('* ')) {
                    return <li key={i} className="ml-4 list-disc text-xs text-slate-400">{line.substring(2)}</li>;
                  }
                  // Render raw markdown simple bold tags
                  const cleanLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                  return <p key={i} className="text-xs leading-relaxed text-slate-300" dangerouslySetInnerHTML={{ __html: cleanLine || '&nbsp;' }} />;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
