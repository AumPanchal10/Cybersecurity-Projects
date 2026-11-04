import React, { useState } from 'react';
import { HostScanReport, PortScanResult } from '../../types';
import { 
  Terminal, Shield, Play, Copy, Check, ExternalLink, 
  Image as ImageIcon, FileCode, CheckCircle2, AlertTriangle, 
  XCircle, Server, Code, Eye
} from 'lucide-react';

const AUTHENTIC_JSON_REPORT = {
  "45.33.32.156": {
    "osmatch": {},
    "ports": [
      { "protocol": "tcp", "portid": "21", "state": "filtered", "reason": "no-response", "reason_ttl": "0", "service": { "name": "ftp", "method": "table", "conf": "3" }, "cpe": [], "scripts": [] },
      { "protocol": "tcp", "portid": "22", "state": "open", "reason": "syn-ack", "reason_ttl": "64", "service": { "name": "ssh", "method": "table", "conf": "3", "version": "OpenSSH 8.2p1 Ubuntu" }, "cpe": ["cpe:/a:openbsd:openssh:8.2p1"], "scripts": [] },
      { "protocol": "tcp", "portid": "23", "state": "filtered", "reason": "no-response", "reason_ttl": "0", "service": { "name": "telnet", "method": "table", "conf": "3" }, "cpe": [], "scripts": [] },
      { "protocol": "tcp", "portid": "25", "state": "filtered", "reason": "no-response", "reason_ttl": "0", "service": { "name": "smtp", "method": "table", "conf": "3" }, "cpe": [], "scripts": [] },
      { "protocol": "tcp", "portid": "80", "state": "open", "reason": "syn-ack", "reason_ttl": "64", "service": { "name": "http", "method": "table", "conf": "3", "version": "Apache httpd 2.4.41" }, "cpe": ["cpe:/a:apache:http_server:2.4.41"], "scripts": [] },
      { "protocol": "tcp", "portid": "110", "state": "filtered", "reason": "no-response", "reason_ttl": "0", "service": { "name": "pop3", "method": "table", "conf": "3" }, "cpe": [], "scripts": [] },
      { "protocol": "tcp", "portid": "139", "state": "filtered", "reason": "no-response", "reason_ttl": "0", "service": { "name": "netbios-ssn", "method": "table", "conf": "3" }, "cpe": [], "scripts": [] },
      { "protocol": "tcp", "portid": "443", "state": "filtered", "reason": "no-response", "reason_ttl": "0", "service": { "name": "https", "method": "table", "conf": "3" }, "cpe": [], "scripts": [] },
      { "protocol": "tcp", "portid": "445", "state": "filtered", "reason": "no-response", "reason_ttl": "0", "service": { "name": "microsoft-ds", "method": "table", "conf": "3" }, "cpe": [], "scripts": [] },
      { "protocol": "tcp", "portid": "3389", "state": "filtered", "reason": "no-response", "reason_ttl": "0", "service": { "name": "ms-wbt-server", "method": "table", "conf": "3" }, "cpe": [], "scripts": [] }
    ],
    "hostname": [
      { "name": "scanme.nmap.org", "type": "user" },
      { "name": "scanme.nmap.org", "type": "PTR" }
    ],
    "macaddress": null,
    "state": { "state": "up", "reason": "syn-ack", "reason_ttl": "255" },
    "runtime": {
      "time": "1739875316",
      "timestr": "Tue Feb 18 16:11:56 2025",
      "summary": "Nmap done at Tue Feb 18 16:11:56 2025; 1 IP address (1 host up) scanned in 2.70 seconds",
      "elapsed": "2.70",
      "exit": "success"
    },
    "stats": {
      "scanner": "nmap",
      "args": "/usr/lib/nmap/nmap -v -oX --top-ports 10 scanme.nmap.org",
      "start": "1739875311",
      "version": "7.94SVN"
    }
  }
};

export const NmapScriptingModule: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'terminal' | 'ports_gui' | 'python_nmap3' | 'screenshots'>('terminal');
  const [targetHost, setTargetHost] = useState('scanme.nmap.org');
  const [selectedTopPorts, setSelectedTopPorts] = useState<number>(10);
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    '┌──(root㉿Kali)-[~]',
    '└─# nmap scanme.nmap.org --top-ports 10',
    'Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-02-18 14:27 IST',
    'Nmap scan report for scanme.nmap.org (45.33.32.156)',
    'Host is up (0.052s latency).',
    'Other addresses for scanme.nmap.org (not scanned): 2600:3c01::f03c:91ff:fe18:bb2f',
    '',
    'PORT     STATE    SERVICE',
    '21/tcp   filtered ftp',
    '22/tcp   open     ssh',
    '23/tcp   filtered telnet',
    '25/tcp   filtered smtp',
    '80/tcp   open     http',
    '110/tcp  filtered pop3',
    '139/tcp  filtered netbios-ssn',
    '443/tcp  filtered https',
    '445/tcp  filtered microsoft-ds',
    '3389/tcp filtered ms-wbt-server',
    '',
    'Nmap done: 1 IP address (1 host up) scanned in 2.70 seconds',
    '┌──(root㉿Kali)-[~]',
    '└─#'
  ]);
  const [commandInput, setCommandInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const portsData: PortScanResult[] = AUTHENTIC_JSON_REPORT["45.33.32.156"].ports.map((p) => ({
    port: parseInt(p.portid, 10),
    protocol: p.protocol,
    state: p.state as any,
    service: p.service.name,
    version: (p.service as any).version || 'Unknown',
    reason: p.reason
  }));

  const runNmapCommand = (cmd: string) => {
    setIsScanning(true);
    setTerminalHistory(prev => [
      ...prev,
      `┌──(root㉿Kali)-[~]`,
      `└─# ${cmd}`
    ]);

    setTimeout(() => {
      if (cmd.includes('portscan.py') || cmd.includes('python3')) {
        setTerminalHistory(prev => [
          ...prev,
          JSON.stringify(AUTHENTIC_JSON_REPORT, null, 2),
          `┌──(root㉿Kali)-[~]`,
          `└─#`
        ]);
      } else {
        setTerminalHistory(prev => [
          ...prev,
          `Starting Nmap 7.94SVN ( https://nmap.org ) at ${new Date().toISOString().slice(0, 10)} 15:42 IST`,
          `Nmap scan report for ${targetHost} (45.33.32.156)`,
          `Host is up (0.048s latency).`,
          ``,
          `PORT     STATE    SERVICE`,
          `21/tcp   filtered ftp`,
          `22/tcp   open     ssh`,
          `23/tcp   filtered telnet`,
          `25/tcp   filtered smtp`,
          `80/tcp   open     http`,
          `110/tcp  filtered pop3`,
          `139/tcp  filtered netbios-ssn`,
          `443/tcp  filtered https`,
          `445/tcp  filtered microsoft-ds`,
          `3389/tcp filtered ms-wbt-server`,
          ``,
          `Nmap done: 1 IP address (1 host up) scanned in 2.64 seconds`,
          `┌──(root㉿Kali)-[~]`,
          `└─#`
        ]);
      }
      setIsScanning(false);
    }, 600);
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    const cmd = commandInput.trim();
    setCommandInput('');
    runNmapCommand(cmd);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const openPortsCount = portsData.filter(p => p.state === 'open').length;
  const filteredPortsCount = portsData.filter(p => p.state === 'filtered').length;
  const closedPortsCount = portsData.filter(p => p.state === 'closed').length;

  return (
    <div className="space-y-6">
      {/* Sub Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyber-border pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white tracking-wide">Nmap & Python Scripting Lab</h2>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30">
              Process.text & python-nmap3
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Network port scanning reconnaissance, Kali Linux terminal emulation & Python nmap3 automation
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('terminal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeSubTab === 'terminal'
                ? 'bg-blue-500 text-slate-950 font-semibold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Kali Linux Terminal
          </button>
          <button
            onClick={() => setActiveSubTab('ports_gui')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeSubTab === 'ports_gui'
                ? 'bg-blue-500 text-slate-950 font-semibold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Scan Report GUI
          </button>
          <button
            onClick={() => setActiveSubTab('python_nmap3')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeSubTab === 'python_nmap3'
                ? 'bg-blue-500 text-slate-950 font-semibold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Python nmap3 Code & JSON
          </button>
          <button
            onClick={() => setActiveSubTab('screenshots')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeSubTab === 'screenshots'
                ? 'bg-blue-500 text-slate-950 font-semibold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Original Evidence (1.png & 2.png)
          </button>
        </div>
      </div>

      {/* Target Config Bar */}
      <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Server className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <div className="text-xs font-mono text-slate-400">Target Host (Authorized Test System)</div>
              <div className="text-sm font-bold font-mono text-white flex items-center space-x-2">
                <span>{targetHost}</span>
                <span className="text-xs font-normal text-slate-400">(45.33.32.156)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => runNmapCommand('nmap scanme.nmap.org --top-ports 10')}
              disabled={isScanning}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs transition disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run nmap --top-ports 10</span>
            </button>

            <button
              onClick={() => runNmapCommand('python3 portscan.py')}
              disabled={isScanning}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 text-xs font-mono transition disabled:opacity-50"
            >
              <Code className="w-3.5 h-3.5" />
              <span>python3 portscan.py</span>
            </button>
          </div>
        </div>
      </div>

      {/* Terminal View */}
      {activeSubTab === 'terminal' && (
        <div className="rounded-xl bg-[#0d1117] border border-slate-800 overflow-hidden shadow-2xl">
          {/* Kali Linux Window Header */}
          <div className="px-4 py-2.5 bg-[#161b22] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
              </div>
              <span className="text-xs font-mono text-slate-400 pl-2">root@Kali: ~</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Kali Linux 2025.1</span>
          </div>

          {/* Terminal Content */}
          <div className="p-4 font-mono text-xs text-slate-200 h-96 overflow-y-auto space-y-1 select-text bg-[#0b0f15]">
            {terminalHistory.map((line, idx) => {
              let isPrompt = line.includes('┌──(root㉿Kali)') || line.includes('└─#');
              let isOpenPort = line.includes('open');
              let isFilteredPort = line.includes('filtered');
              let isNmapDone = line.includes('Nmap done:');

              if (line.includes('┌──(root㉿Kali)')) {
                return (
                  <div key={idx} className="text-blue-400 font-bold pt-1">
                    ┌──(<span className="text-red-500">root㉿Kali</span>)-[~]
                  </div>
                );
              }
              if (line.startsWith('└─#')) {
                return (
                  <div key={idx} className="text-blue-400 font-bold">
                    └─# <span className="text-white font-normal">{line.replace('└─# ', '')}</span>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className={`${
                    isOpenPort ? 'text-emerald-400 font-bold' :
                    isFilteredPort ? 'text-amber-400' :
                    isNmapDone ? 'text-cyan-400 font-semibold pt-1' :
                    'text-slate-300'
                  }`}
                >
                  {line}
                </div>
              );
            })}
          </div>

          {/* Terminal Input Bar */}
          <form onSubmit={handleCommandSubmit} className="border-t border-slate-800 bg-[#161b22] px-4 py-2.5 flex items-center space-x-2 font-mono text-xs">
            <span className="text-red-400 font-bold">root@Kali:~#</span>
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Try: nmap scanme.nmap.org --top-ports 10 or python3 portscan.py"
              className="flex-1 bg-transparent text-emerald-400 focus:outline-none placeholder-slate-600"
            />
            <button
              type="submit"
              className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 text-[11px]"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Port Scanner GUI Tab */}
      {activeSubTab === 'ports_gui' && (
        <div className="space-y-4">
          {/* Summary badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-cyber-card border border-cyber-border">
              <span className="text-[11px] font-mono text-emerald-400 uppercase">Open Ports</span>
              <div className="flex items-center space-x-2 mt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xl font-bold font-mono text-emerald-400">{openPortsCount}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Port 22 (SSH), Port 80 (HTTP)</span>
            </div>

            <div className="p-3.5 rounded-xl bg-cyber-card border border-cyber-border">
              <span className="text-[11px] font-mono text-amber-400 uppercase">Filtered Ports</span>
              <div className="flex items-center space-x-2 mt-1">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-xl font-bold font-mono text-amber-400">{filteredPortsCount}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Firewall packet drop / no-response</span>
            </div>

            <div className="p-3.5 rounded-xl bg-cyber-card border border-cyber-border">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Closed Ports</span>
              <div className="flex items-center space-x-2 mt-1">
                <XCircle className="w-4 h-4 text-slate-500" />
                <span className="text-xl font-bold font-mono text-slate-300">{closedPortsCount}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">RST received / unmapped</span>
            </div>
          </div>

          {/* Port Results Table */}
          <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Nmap Scan Report (45.33.32.156)</h3>
              <span className="text-xs font-mono text-slate-400">Scan duration: 2.70s</span>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Port / Protocol</th>
                    <th className="py-2.5 px-3">State</th>
                    <th className="py-2.5 px-3">Service</th>
                    <th className="py-2.5 px-3">Service Banner / Version</th>
                    <th className="py-2.5 px-3">Detection Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {portsData.map((port) => (
                    <tr key={port.port} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-bold text-white">{port.port}/{port.protocol}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          port.state === 'open'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : port.state === 'filtered'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {port.state.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{port.service}</td>
                      <td className="py-2.5 px-3 text-slate-400">{port.version}</td>
                      <td className="py-2.5 px-3 text-slate-400">{port.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Python nmap3 Code & JSON Tab */}
      {activeSubTab === 'python_nmap3' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Script from Process.text */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-200">portscan.py (using python-nmap3)</span>
              <button
                onClick={() => copyToClipboard(`import nmap3
import json

# Initialize Nmap scanner
nmap = nmap3.Nmap()

# Scan top 10 ports on target host
results = nmap.scan_top_ports("scanme.nmap.org")

# Print structured JSON output
print(json.dumps(results, indent=2))
`, 'script')}
                className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200"
              >
                {copiedCode === 'script' ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode === 'script' ? 'Copied' : 'Copy Python'}</span>
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`# From Process.text:
# 1. Install library: pip install python-nmap3
# 2. Run port scanner:

import nmap3
import json

# Initialize Nmap scanner
nmap = nmap3.Nmap()

# Scan top 10 ports on target host
results = nmap.scan_top_ports("scanme.nmap.org")

# Returns structured dictionary / JSON
print(json.dumps(results, indent=2))`}
            </pre>
          </div>

          {/* Authentic JSON Output matching 2.png */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-200">JSON Output (from 2.png)</span>
              <button
                onClick={() => copyToClipboard(JSON.stringify(AUTHENTIC_JSON_REPORT, null, 2), 'json')}
                className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200"
              >
                {copiedCode === 'json' ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode === 'json' ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-emerald-300 overflow-y-auto max-h-96 leading-relaxed">
              {JSON.stringify(AUTHENTIC_JSON_REPORT, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Screenshots Tab */}
      {activeSubTab === 'screenshots' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border space-y-2">
            <h3 className="text-sm font-bold text-white">Original Kali Linux Screenshots (1.png & 2.png)</h3>
            <p className="text-xs text-slate-400">
              Preserved from the repository in <code className="text-slate-300 font-mono">Nmap and Python Scripting/</code> documenting the scan executions on Kali Linux.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1.png */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-200">1.png: Nmap Terminal Scan</span>
                <span className="text-[11px] font-mono text-slate-400">nmap --top-ports 10</span>
              </div>
              <div 
                className="rounded-lg overflow-hidden border border-slate-800 cursor-pointer group relative"
                onClick={() => setPreviewImage('/data/1.png')}
              >
                <img src="/data/1.png" alt="Nmap Scan Terminal" className="w-full object-cover group-hover:opacity-90 transition" />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <span className="px-3 py-1.5 rounded-lg bg-slate-900/90 text-white text-xs font-mono flex items-center space-x-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Zoom Image</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 2.png */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-200">2.png: Python3 JSON Portscan Output</span>
                <span className="text-[11px] font-mono text-slate-400">python3 portscan.py</span>
              </div>
              <div 
                className="rounded-lg overflow-hidden border border-slate-800 cursor-pointer group relative"
                onClick={() => setPreviewImage('/data/2.png')}
              >
                <img src="/data/2.png" alt="Python3 Portscan JSON Output" className="w-full object-cover group-hover:opacity-90 transition" />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <span className="px-3 py-1.5 rounded-lg bg-slate-900/90 text-white text-xs font-mono flex items-center space-x-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Zoom Image</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Lightbox Modal */}
          {previewImage && (
            <div 
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
              onClick={() => setPreviewImage(null)}
            >
              <div className="max-w-4xl max-h-[90vh] overflow-auto bg-slate-900 p-2 rounded-xl border border-slate-700 shadow-2xl">
                <img src={previewImage} alt="Enlarged screenshot" className="w-full h-auto rounded" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
