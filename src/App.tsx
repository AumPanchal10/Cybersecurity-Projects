import React, { useState } from 'react';
import { ProjectTab } from './types';
import { Navbar } from './components/Navbar';
import { OverviewModule } from './components/OverviewModule';
import { ApiFuzzerModule } from './components/ApiFuzzer/ApiFuzzerModule';
import { NetworkTrackingModule } from './components/NetworkTracking/NetworkTrackingModule';
import { NmapScriptingModule } from './components/NmapScripting/NmapScriptingModule';
import { WifiSniffingModule } from './components/WifiSniffing/WifiSniffingModule';
import { Shield, GitBranch, Terminal } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ProjectTab>('overview');

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewModule onSelectTab={setActiveTab} />
        )}
        {activeTab === 'fuzzer' && (
          <ApiFuzzerModule />
        )}
        {activeTab === 'tracking' && (
          <NetworkTrackingModule />
        )}
        {activeTab === 'nmap' && (
          <NmapScriptingModule />
        )}
        {activeTab === 'wifi' && (
          <WifiSniffingModule />
        )}
      </main>

      {/* Bottom Status / Footer Bar */}
      <footer className="border-t border-cyber-border bg-[#0d121c]/80 text-slate-400 text-xs py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1.5 font-mono text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span>All Systems Operational</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="font-mono text-slate-400">Environment: React 18 + Vite + Tailwind CSS</span>
          </div>

          <div className="flex items-center space-x-4 font-mono text-[11px] text-slate-500">
            <span>Imported from: AumPanchal10/Cybersecurity-Projects</span>
            <span>Educational Research License</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
