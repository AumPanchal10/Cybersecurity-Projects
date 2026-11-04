import React from 'react';
import { ProjectTab } from '../types';
import { Shield, Search, Globe, Terminal, Wifi, LayoutDashboard, ExternalLink } from 'lucide-react';

interface NavbarProps {
  activeTab: ProjectTab;
  onTabChange: (tab: ProjectTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'overview' as ProjectTab, label: 'Overview', icon: LayoutDashboard, count: '4 Labs' },
    { id: 'fuzzer' as ProjectTab, label: 'API Fuzzer', icon: Search, badge: 'REST' },
    { id: 'tracking' as ProjectTab, label: 'PCAP & Geo Map', icon: Globe, badge: 'Wireshark' },
    { id: 'nmap' as ProjectTab, label: 'Nmap & Python', icon: Terminal, badge: 'Kali' },
    { id: 'wifi' as ProjectTab, label: 'WiFi Probe Sniffer', icon: Wifi, badge: '802.11' },
  ];

  return (
    <header className="border-b border-cyber-border bg-[#0d121c]/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange('overview')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-cyber-card border border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/20">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-100 text-base tracking-wide font-mono">CyberStudio</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v2.0 React
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Cybersecurity Projects & Research Suite
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-cyber-card text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="hidden md:inline">{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Source Repo Badge */}
          <div className="hidden lg:flex items-center space-x-3">
            <a
              href="https://github.com/AumPanchal10/Cybersecurity-Projects"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900/80 px-2.5 py-1.5 rounded-md border border-slate-800 hover:border-slate-700 transition"
              title="View original GitHub repository"
            >
              <span className="font-mono text-slate-400">AumPanchal10/Cyber...</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
