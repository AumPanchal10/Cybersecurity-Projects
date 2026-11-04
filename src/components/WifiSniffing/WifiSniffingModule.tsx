import React, { useState, useEffect, useRef } from 'react';
import { ProbeRequest } from '../../types';
import { 
  Wifi, Play, Pause, RotateCcw, ShieldAlert, Radio, 
  Terminal, Copy, Check, Info, Smartphone, Laptop, 
  Cpu, Layers, Search, Download
} from 'lucide-react';

const SAMPLE_PROBES: Array<{ mac: string; vendor: string; ssid: string; rssi: number; channel: number; band: '2.4 GHz' | '5 GHz' }> = [
  { mac: 'dc:a6:32:8a:1f:22', vendor: 'Apple Inc. (iPhone 15)', ssid: 'Home_WiFi_5G', rssi: -52, channel: 36, band: '5 GHz' },
  { mac: 'dc:a6:32:8a:1f:22', vendor: 'Apple Inc. (iPhone 15)', ssid: 'Starbucks_Guest', rssi: -54, channel: 6, band: '2.4 GHz' },
  { mac: 'f4:34:f0:12:44:aa', vendor: 'Samsung Electronics (Galaxy S24)', ssid: 'Airport_Free_WiFi', rssi: -68, channel: 1, band: '2.4 GHz' },
  { mac: 'f4:34:f0:12:44:aa', vendor: 'Samsung Electronics (Galaxy S24)', ssid: 'Corporate_WPA2_Ent', rssi: -66, channel: 11, band: '2.4 GHz' },
  { mac: '70:85:c2:91:e0:05', vendor: 'Intel Corporate (ThinkPad X1)', ssid: 'Office_Secure_Mesh', rssi: -45, channel: 40, band: '5 GHz' },
  { mac: '70:85:c2:91:e0:05', vendor: 'Intel Corporate (ThinkPad X1)', ssid: 'Hotel_Hilton_Guest', rssi: -48, channel: 1, band: '2.4 GHz' },
  { mac: '24:0a:c4:55:78:29', vendor: 'Espressif Inc (Smart Light IoT)', ssid: 'IoT_Automation_2G', rssi: -72, channel: 6, band: '2.4 GHz' },
  { mac: 'b8:27:eb:c8:31:9a', vendor: 'Raspberry Pi Foundation', ssid: 'Lab_Dev_Network', rssi: -60, channel: 11, band: '2.4 GHz' },
  { mac: '3c:5a:37:aa:bb:cc', vendor: 'Google LLC (Pixel 8)', ssid: 'GoogleGuest', rssi: -58, channel: 44, band: '5 GHz' },
  { mac: '3c:5a:37:aa:bb:cc', vendor: 'Google LLC (Pixel 8)', ssid: 'Cafe_Nero_Free', rssi: -62, channel: 6, band: '2.4 GHz' }
];

export const WifiSniffingModule: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'live_sniff' | 'device_footprint' | 'scapy_code'>('live_sniff');
  const [interfaceName, setInterfaceName] = useState('wlan0mon');
  const [isMonitorMode, setIsMonitorMode] = useState(true);
  const [currentChannel, setCurrentChannel] = useState(6);
  const [isSniffing, setIsSniffing] = useState(true);
  const [packets, setPackets] = useState<ProbeRequest[]>([]);
  const [uniqueSsids, setUniqueSsids] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const packetsRef = useRef(packets);
  packetsRef.current = packets;
  const isSniffingRef = useRef(isSniffing);
  isSniffingRef.current = isSniffing;

  // Initialize with authentic probe requests
  useEffect(() => {
    const initial: ProbeRequest[] = SAMPLE_PROBES.slice(0, 5).map((p, idx) => ({
      id: `probe-${idx}-${Date.now()}`,
      timestamp: new Date(Date.now() - (5 - idx) * 3200).toLocaleTimeString(),
      macAddress: p.mac,
      vendor: p.vendor,
      ssid: p.ssid,
      rssi: p.rssi,
      channel: p.channel,
      band: p.band,
      seqNumber: 1040 + idx * 12
    }));

    setPackets(initial);
    setUniqueSsids(Array.from(new Set(initial.map(p => p.ssid))));
  }, []);

  // Periodic sniffing simulation
  useEffect(() => {
    if (!isSniffing) return;

    const interval = setInterval(() => {
      const template = SAMPLE_PROBES[Math.floor(Math.random() * SAMPLE_PROBES.length)];
      const randomRssi = template.rssi + Math.floor(Math.random() * 8) - 4;
      
      const newPacket: ProbeRequest = {
        id: `probe-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString(),
        macAddress: template.mac,
        vendor: template.vendor,
        ssid: template.ssid,
        rssi: randomRssi,
        channel: template.channel,
        band: template.band,
        seqNumber: Math.floor(Math.random() * 4000) + 1000
      };

      setPackets(prev => [newPacket, ...prev.slice(0, 100)]);
      setUniqueSsids(prev => {
        if (!prev.includes(template.ssid)) {
          return [...prev, template.ssid];
        }
        return prev;
      });

      // Channel hopping simulation
      if (Math.random() > 0.6) {
        const channels = [1, 6, 11, 36, 40, 44, 48];
        setCurrentChannel(channels[Math.floor(Math.random() * channels.length)]);
      }

    }, 2800);

    return () => clearInterval(interval);
  }, [isSniffing]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleClear = () => {
    setPackets([]);
    setUniqueSsids([]);
  };

  // Group by MAC to demonstrate footprinting
  const devicesByMac: Record<string, { vendor: string; ssids: Set<string>; lastRssi: number; count: number; lastSeen: string }> = {};
  packets.forEach(p => {
    if (!devicesByMac[p.macAddress]) {
      devicesByMac[p.macAddress] = {
        vendor: p.vendor,
        ssids: new Set<string>(),
        lastRssi: p.rssi,
        count: 0,
        lastSeen: p.timestamp
      };
    }
    devicesByMac[p.macAddress].ssids.add(p.ssid);
    devicesByMac[p.macAddress].count += 1;
    devicesByMac[p.macAddress].lastRssi = p.rssi;
  });

  const filteredPackets = packets.filter(p => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.ssid.toLowerCase().includes(query) ||
      p.macAddress.toLowerCase().includes(query) ||
      p.vendor.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Sub Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyber-border pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white tracking-wide">802.11 WiFi Probe Sniffer</h2>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
              sniffer.py & Scapy Dot11ProbeReq
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Wireless client device discovery, unencrypted SSID probe request capture & footprint analysis
          </p>
        </div>

        {/* Sub tabs */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('live_sniff')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeSubTab === 'live_sniff'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Live Probe Stream
          </button>
          <button
            onClick={() => setActiveSubTab('device_footprint')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeSubTab === 'device_footprint'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Device Footprint Analysis ({Object.keys(devicesByMac).length})
          </button>
          <button
            onClick={() => setActiveSubTab('scapy_code')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeSubTab === 'scapy_code'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Scapy sniffer.py Code
          </button>
        </div>
      </div>

      {/* Top Interface & Monitor Mode Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-cyber-card border border-cyber-border">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Wireless Interface</span>
          <div className="flex items-center space-x-2 mt-1">
            <Radio className="w-4 h-4 text-amber-400" />
            <span className="text-base font-bold font-mono text-white">{interfaceName}</span>
          </div>
          <span className="text-[10px] text-emerald-400 mt-1 block">Monitor Mode Active</span>
        </div>

        <div className="p-3.5 rounded-xl bg-cyber-card border border-cyber-border">
          <span className="text-[11px] font-mono text-amber-400 uppercase">Hopping Channel</span>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xl font-bold font-mono text-amber-400">CH {currentChannel}</span>
            <span className="text-xs font-mono text-slate-400">({currentChannel <= 14 ? '2.4 GHz' : '5 GHz'})</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">802.11 b/g/n/ac/ax</span>
        </div>

        <div className="p-3.5 rounded-xl bg-cyber-card border border-cyber-border">
          <span className="text-[11px] font-mono text-cyan-400 uppercase">Discovered SSIDs</span>
          <div className="flex items-center space-x-2 mt-1">
            <Wifi className="w-4 h-4 text-cyan-400" />
            <span className="text-xl font-bold font-mono text-cyan-400">{uniqueSsids.length}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Unique network names</span>
        </div>

        <div className="p-3.5 rounded-xl bg-cyber-card border border-cyber-border flex flex-col justify-between">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Sniffer Control</span>
          <div className="flex items-center space-x-2 mt-1">
            {isSniffing ? (
              <button
                onClick={() => setIsSniffing(false)}
                className="px-3 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-semibold flex items-center space-x-1"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={() => setIsSniffing(true)}
                className="px-3 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-semibold flex items-center space-x-1"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume</span>
              </button>
            )}

            <button
              onClick={handleClear}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-mono"
              title="Clear capture buffer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Live Probe Stream View */}
      {activeSubTab === 'live_sniff' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Live 802.11 Probe Request Frame Feed</h3>
                <span className="text-xs font-mono text-slate-400">({packets.length} frames captured)</span>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by SSID, MAC, vendor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 w-56 sm:w-64"
                />
              </div>
            </div>

            {/* Live table */}
            <div className="overflow-x-auto max-h-96 overflow-y-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Client MAC Address</th>
                    <th className="py-2.5 px-3">Vendor / OUI</th>
                    <th className="py-2.5 px-3">Requested SSID (Dot11.info)</th>
                    <th className="py-2.5 px-3">RSSI</th>
                    <th className="py-2.5 px-3">Channel</th>
                    <th className="py-2.5 px-3">Frame Subtype</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredPackets.map((pkt) => (
                    <tr key={pkt.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 text-slate-400">{pkt.timestamp}</td>
                      <td className="py-2.5 px-3 font-bold text-amber-300">{pkt.macAddress}</td>
                      <td className="py-2.5 px-3 text-slate-300">{pkt.vendor}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                          "{pkt.ssid}"
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-xs ${
                          pkt.rssi > -60 ? 'text-emerald-400' : pkt.rssi > -75 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {pkt.rssi} dBm
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">CH {pkt.channel} ({pkt.band})</td>
                      <td className="py-2.5 px-3 text-slate-500">Dot11ProbeReq (0x04)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Device Footprint Analysis Tab */}
      {activeSubTab === 'device_footprint' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start space-x-3 text-xs text-slate-300">
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-white">Privacy Risk: 802.11 Probe Request Footprinting</span>
              <p className="text-slate-400 leading-relaxed">
                When devices leave known networks, they repeatedly broadcast unencrypted Probe Requests asking "Is <code className="text-amber-300 font-mono">'Home_WiFi'</code> nearby?". Eavesdroppers in monitor mode capture these requests to deduce previously visited locations, hotels, and workplace identities.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(devicesByMac).map(([mac, data]) => (
              <div key={mac} className="p-4 rounded-xl bg-cyber-card border border-cyber-border space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {data.vendor.includes('iPhone') || data.vendor.includes('Galaxy') || data.vendor.includes('Pixel') ? (
                      <Smartphone className="w-5 h-5 text-amber-400" />
                    ) : (
                      <Laptop className="w-5 h-5 text-cyan-400" />
                    )}
                    <div>
                      <div className="font-mono font-bold text-sm text-white">{mac}</div>
                      <div className="text-xs text-slate-400">{data.vendor}</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {data.count} Probes
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-semibold text-slate-400">Probed Network Fingerprint:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(data.ssids).map((ssid, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-xs font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {ssid}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-500">
                  <span>Last Signal: {data.lastRssi} dBm</span>
                  <span>Last Seen: {data.lastSeen}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scapy Python Code Tab */}
      {activeSubTab === 'scapy_code' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-200">Python WiFi Sniffing/sniffer.py</span>
              <button
                onClick={() => copyToClipboard(`from scapy.all import *

interface = 'wlan0mon'
probeReqs = []

def sniffProves(p):
    # Check if packet contains 802.11 Probe Request layer
    if p.haslayer(Dot11ProbeReq):
        netName = p.getlayer(Dot11ProbeReq).info.decode('utf-8', errors='ignore')
        if netName and netName not in probeReqs:
            probeReqs.append(netName)
            print('[+] Detected New Probe Request: ' + netName)

# Start sniffing in monitor mode
sniff(iface=interface, prn=sniffProves)
`, 'sniffer')}
                className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200"
              >
                {copiedCode === 'sniffer' ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode === 'sniffer' ? 'Copied' : 'Copy Scapy'}</span>
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`from scapy.all import *

interface = 'wlan0'
probeReqs = []

def sniffProves(p):
    if p.haslayer(Dot11ProbeReq):
        netName = p.getlayer(Dot11ProbeReq).info
        if netName not in probeReqs:
            probeReqs.append(netName)
            print('[+] Detected New Probe Request: ' + str(netName))

sniff(iface=interface, prn=sniffProves)`}
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs text-slate-300 font-mono">
            <div className="font-bold text-white text-sm">How to run in Kali Linux:</div>
            <div className="bg-slate-950 p-3 rounded border border-slate-800/80 text-amber-400 space-y-1">
              <div># 1. Put wireless card into monitor mode</div>
              <div className="text-white">sudo airmon-ng start wlan0</div>
              <div className="mt-2 text-slate-400"># 2. Run the sniffer script as root</div>
              <div className="text-white">sudo python3 sniffer.py</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
