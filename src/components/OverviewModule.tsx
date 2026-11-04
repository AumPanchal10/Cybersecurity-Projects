import React from 'react';
import { ProjectTab } from '../types';
import { Search, Globe, Terminal, Wifi, ArrowRight, ShieldCheck, FileCode, CheckCircle2, Cpu, Server, MapPin } from 'lucide-react';

interface OverviewModuleProps {
  onSelectTab: (tab: ProjectTab) => void;
}

export const OverviewModule: React.FC<OverviewModuleProps> = ({ onSelectTab }) => {
  const projects = [
    {
      id: 'fuzzer' as ProjectTab,
      title: 'API Fuzzer',
      subtitle: 'Endpoint Discovery & Status Analysis',
      folder: '/API Fuzzer',
      files: ['main.py', 'server.py', 'words.txt'],
      icon: Search,
      color: 'emerald',
      tag: 'Offensive / Defensive Testing',
      description:
        'Simulates an active REST API fuzzer testing HTTP endpoints against a dictionary wordlist. Discovers hidden paths, analyzes HTTP 200 vs 404/403 responses, logs response times, and generates ready-to-run Python requests scripts.',
      features: [
        'Interactive wordlist runner (default words.txt + custom/presets)',
        'Built-in simulated Flask API server with configurable mock responses',
        'Live request rate control, status distribution analytics & payload viewer',
        'Python main.py & server.py exporter'
      ]
    },
    {
      id: 'tracking' as ProjectTab,
      title: 'Network Tracking (Wireshark & Maps)',
      subtitle: 'PCAP Geolocation & KML Generation',
      folder: '/Network Tracking using Wireshark and Google Maps',
      files: ['wire.pcap', 'main.py', 'desc.txt'],
      icon: Globe,
      color: 'cyan',
      tag: 'Threat Detection / Forensics',
      description:
        'Dissects Wireshark PCAP network captures, extracts public and internal IPv4 packets, resolves geographic coordinates, visualizes communication links on an interactive dark world map, and exports data to KML format for Google Earth/Maps.',
      features: [
        'Browser-native binary PCAP parser with wire.pcap loaded + drag-and-drop',
        'Interactive Leaflet map with global IP pins and connection arcs',
        'Wireshark-style packet inspector (TCP, UDP, TLS, DNS, MDNS, SMB)',
        'KML & GeoJSON export matching fastkml logic from main.py'
      ]
    },
    {
      id: 'nmap' as ProjectTab,
      title: 'Nmap & Python Scripting',
      subtitle: 'Port Scanning & python-nmap3 Lab',
      folder: '/Nmap and Python Scripting',
      files: ['Process.text', '1.png', '2.png'],
      icon: Terminal,
      color: 'blue',
      tag: 'Reconnaissance / Automation',
      description:
        'Explores network reconnaissance through Kali Linux Nmap scans and Python automation using python-nmap3. Features an interactive Kali terminal reproducing the authentic scan of scanme.nmap.org, port state breakdown, and JSON parsing.',
      features: [
        'Authentic Kali Linux root terminal emulator running nmap & python3',
        'Top 10 / 20 / 100 port scanner against targets (scanme.nmap.org)',
        'Interactive Python nmap3 code generator and JSON response viewer',
        'Original Kali screenshots (1.png, 2.png) and Process walkthrough'
      ]
    },
    {
      id: 'wifi' as ProjectTab,
      title: '802.11 WiFi Probe Sniffer',
      subtitle: 'Scapy Dot11ProbeReq Packet Analyzer',
      folder: '/Python WiFi Sniffing',
      files: ['sniffer.py'],
      icon: Wifi,
      color: 'amber',
      tag: 'Wireless Security / Privacy',
      description:
        'Demonstrates how wireless client devices broadcast unencrypted 802.11 probe requests searching for known SSIDs. Analyzes device footprints, MAC addresses, vendor OUIs, signal RSSI, and generates Scapy sniffing scripts.',
      features: [
        'Real-time 802.11 probe request stream simulation on wlan0 interface',
        'Device footprint profiling: tracks probed SSIDs per client device',
        'Hardware vendor identification (Apple, Samsung, Intel, Google)',
        'Scapy Dot11ProbeReq Python script runner & educational analysis'
      ]
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-cyber-card via-[#121c2e] to-cyber-card border border-cyber-border p-6 sm:p-8 overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Cybersecurity Projects Portfolio & Interactive Workbench</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Offensive & Defensive Security Suite
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Rewritten as an interactive React application from the original Python cybersecurity research repository.
            Explore live network packet forensics, REST API fuzzing, Nmap port scanning automation, and 802.11 wireless probe sniffing in a unified web environment.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono text-slate-400">
            <div className="flex items-center space-x-1.5 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>4 Modules Ported</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Client-Side Binary Parsers</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>Interactive Leaflet Map</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              <span>Python & KML Exporters</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((proj) => {
          const Icon = proj.icon;
          return (
            <div
              key={proj.id}
              className="group relative rounded-xl bg-cyber-card border border-cyber-border hover:border-slate-600 transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-emerald-500/5"
            >
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/60 text-emerald-400 group-hover:border-emerald-500/40 transition">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition">
                        {proj.title}
                      </h3>
                      <p className="text-xs text-slate-400">{proj.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/50">
                    {proj.tag}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {proj.description}
                </p>

                {/* Feature checklist */}
                <div className="space-y-1.5 pt-1">
                  {proj.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Original Files Pill */}
                <div className="pt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-400">
                  <span className="text-slate-500">Source:</span>
                  {proj.files.map((f, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-4 bg-slate-950/60 border-t border-cyber-border flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">{proj.folder}</span>
                <button
                  onClick={() => onSelectTab(proj.id)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition"
                >
                  <span>Launch Lab</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Disclaimer & Educational Context */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-5 flex items-start space-x-4">
        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs text-slate-300">
          <h4 className="font-semibold text-slate-100 text-sm">Educational & Defensive Purpose</h4>
          <p className="leading-relaxed text-slate-400">
            These cybersecurity tools are intended for security researchers, network administrators, and students studying threat intelligence, defensive monitoring, and API resilience. All automated probing, packet captures, and port scans must only be performed on systems and networks you own or have explicit authorization to audit (such as <code className="text-emerald-400">scanme.nmap.org</code>).
          </p>
        </div>
      </div>
    </div>
  );
};
