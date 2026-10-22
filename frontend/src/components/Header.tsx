import React, { useState } from 'react';
import { Menu, Bell, Play, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { analysisApi, simulatorApi } from '../services/api';

interface HeaderProps {
  onToggleSidebar: () => void;
  onRefreshData?: () => void;
  unreadAlertCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onRefreshData,
  unreadAlertCount = 2
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await analysisApi.runAnalysis();
      setNotificationMsg(`Detection complete! Generated ${res.findings_generated} findings.`);
      if (onRefreshData) onRefreshData();
    } catch {
      setNotificationMsg('Waste analysis triggered.');
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setNotificationMsg(null), 4000);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset demo environment to standard sample resources and metrics?')) return;
    setIsSeeding(true);
    try {
      await simulatorApi.run(true);
      setNotificationMsg('Demo environment reset successfully.');
      if (onRefreshData) onRefreshData();
    } catch {
      setNotificationMsg('Failed to reset demo.');
    } finally {
      setIsSeeding(false);
      setTimeout(() => setNotificationMsg(null), 4000);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#090d16]/90 backdrop-blur-md border-b border-[#1e293b] px-4 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile Toggle & Status */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg bg-[#111726] border border-[#1e293b] text-slate-300 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Live Simulator Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="tracking-wide">SIMULATOR ACTIVE</span>
        </div>

        {/* AWS Ready indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>AWS Adapter Ready</span>
        </div>
      </div>

      {/* Center Toast notification */}
      {notificationMsg && (
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs animate-fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Right: Quick Action Controls */}
      <div className="flex items-center gap-2.5">
        {/* Reset Demo button */}
        <button
          onClick={handleResetDemo}
          disabled={isSeeding}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111726] border border-[#1e293b] hover:border-slate-600 text-xs font-medium text-slate-300 hover:text-white transition-all disabled:opacity-50"
          title="Reset sample metrics & resources"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin text-blue-400' : ''}`} />
          <span>Reset Demo</span>
        </button>

        {/* Run Waste Detection Action */}
        <button
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isAnalyzing ? 'animate-pulse' : ''}`} />
          <span>{isAnalyzing ? 'Scanning...' : 'Detect Waste'}</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => { if (onRefreshData) onRefreshData(); }}
            className="p-2 rounded-lg bg-[#111726] border border-[#1e293b] text-slate-300 hover:text-white relative"
            title="Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                {unreadAlertCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
