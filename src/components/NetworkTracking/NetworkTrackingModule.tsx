import React, { useState, useEffect, useRef } from 'react';
import { PacketRecord, IpGeoLocation } from '../../types';
import { parsePcapArrayBuffer, getInitialWirePcapData } from '../../utils/pcapParser';
import { generateKmlString, generateGeoJson, downloadFile } from '../../utils/kmlExporter';
import { 
  Globe, Download, Upload, Filter, Search, MapPin, 
  Layers, FileCode, Check, Copy, ExternalLink, RefreshCw, Eye
} from 'lucide-react';

export const NetworkTrackingModule: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'map_and_packets' | 'ip_table' | 'python_code'>('map_and_packets');
  const [packets, setPackets] = useState<PacketRecord[]>([]);
  const [geoIps, setGeoIps] = useState<IpGeoLocation[]>([]);
  const [selectedPacket, setSelectedPacket] = useState<PacketRecord | null>(null);
  const [selectedGeo, setSelectedGeo] = useState<IpGeoLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('wire.pcap (Default Capture)');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Initialize data on mount
  useEffect(() => {
    // Start with pre-parsed dataset for immediate rendering
    const initial = getInitialWirePcapData();
    setPackets(initial.packets);
    setGeoIps(initial.geoIps);

    // Also attempt to fetch public/data/wire.pcap to demonstrate binary parsing
    fetch('/data/wire.pcap')
      .then(res => {
        if (!res.ok) throw new Error('File not found');
        return res.arrayBuffer();
      })
      .then(buffer => {
        try {
          const parsed = parsePcapArrayBuffer(buffer, 500);
          if (parsed.packets.length > 0) {
            setPackets(parsed.packets);
            setGeoIps(parsed.geoIps);
          }
        } catch (e) {
          console.warn('Binary PCAP parse notice:', e);
        }
      })
      .catch(() => {
        // Pre-parsed dataset is already active
      });
  }, []);

  // Handle custom PCAP upload
  const handlePcapUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const parsed = parsePcapArrayBuffer(buffer, 1500);
        setPackets(parsed.packets);
        setGeoIps(parsed.geoIps);
        setSelectedPacket(null);
        setSelectedGeo(null);
      } catch (err: any) {
        alert(`Error parsing PCAP: ${err.message || 'Corrupted or unsupported format'}`);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Setup Leaflet map when mapContainerRef is ready
  useEffect(() => {
    if (activeSubTab !== 'map_and_packets' || !mapContainerRef.current) return;

    // Check if window.L exists (from index.html CDN)
    const L = (window as any).L;
    if (!L) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [30, 0],
        zoom: 2,
        minZoom: 1,
        maxZoom: 18,
        zoomControl: true
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;

    // Clear previous markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Filter public geolocated IPs
    const publicIps = geoIps.filter(g => !g.isPrivate && g.lat !== 0 && g.lon !== 0);

    publicIps.forEach(loc => {
      // Custom green cyber pin icon
      const customIcon = L.divIcon({
        className: 'custom-cyber-marker',
        html: `<div style="
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #00ff88;
          border: 2px solid #ffffff;
          box-shadow: 0 0 12px #00ff88;
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker([loc.lat, loc.lon], { icon: customIcon }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: monospace; font-size: 12px; padding: 4px;">
          <strong style="color: #00ff88; font-size: 13px;">${loc.ip}</strong><br/>
          <span>${loc.city}, ${loc.country}</span><br/>
          <span style="color: #94a3b8;">${loc.org}</span><br/>
          <span style="color: #cbd5e1; font-size: 11px;">Packets: ${loc.packetCount}</span>
        </div>
      `);

      marker.on('click', () => {
        setSelectedGeo(loc);
      });

      markersRef.current.push(marker);
    });

    // Invalidate map size after tab render
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

  }, [activeSubTab, geoIps]);

  // Download KML file (exact feature of main.py save_to_kml)
  const handleDownloadKml = () => {
    const kml = generateKmlString(geoIps);
    downloadFile(kml, 'output.kml', 'application/vnd.google-earth.kml+xml');
  };

  const handleDownloadGeoJson = () => {
    const geojson = generateGeoJson(geoIps);
    downloadFile(geojson, 'network-tracking.geojson', 'application/json');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered packets
  const filteredPackets = packets.filter(p => {
    const matchesProto = protocolFilter === 'ALL' || p.protocol.toUpperCase().includes(protocolFilter);
    const matchesSearch = 
      searchQuery === '' ||
      p.srcIp.includes(searchQuery) ||
      p.dstIp.includes(searchQuery) ||
      p.info.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.protocol.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProto && matchesSearch;
  });

  const publicIpsCount = geoIps.filter(g => !g.isPrivate && g.lat !== 0).length;
  const privateIpsCount = geoIps.filter(g => g.isPrivate).length;

  return (
    <div className="space-y-6">
      {/* Sub Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyber-border pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white tracking-wide">Network Tracking (Wireshark & Maps)</h2>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              wire.pcap & main.py
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            PCAP packet stream dissection, IP geolocation mapping & KML generation for Google Earth / Maps
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('map_and_packets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeSubTab === 'map_and_packets'
                ? 'bg-cyan-500 text-slate-950 font-semibold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Live Map & Packets
          </button>
          <button
            onClick={() => setActiveSubTab('ip_table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeSubTab === 'ip_table'
                ? 'bg-cyan-500 text-slate-950 font-semibold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            IP Geolocation Table ({geoIps.length})
          </button>
          <button
            onClick={() => setActiveSubTab('python_code')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeSubTab === 'python_code'
                ? 'bg-cyan-500 text-slate-950 font-semibold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Python main.py Code
          </button>
        </div>
      </div>

      {/* Top Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-cyber-card border border-cyber-border">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Loaded Capture</span>
          <div className="flex items-center space-x-2 mt-1">
            <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-sm font-bold font-mono text-white truncate">{fileName}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">{packets.length} Packets Decoded</span>
        </div>

        <div className="p-3.5 rounded-xl bg-cyber-card border border-cyber-border">
          <span className="text-[11px] font-mono text-cyan-400 uppercase">Public Endpoints</span>
          <div className="flex items-center space-x-2 mt-1">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span className="text-xl font-bold font-mono text-cyan-400">{publicIpsCount}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Geocoded external hosts</span>
        </div>

        <div className="p-3.5 rounded-xl bg-cyber-card border border-cyber-border">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Internal / LAN Nodes</span>
          <div className="flex items-center space-x-2 mt-1">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="text-xl font-bold font-mono text-slate-300">{privateIpsCount}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">RFC1918 & Multicast</span>
        </div>

        <div className="p-3.5 rounded-xl bg-cyber-card border border-cyber-border flex flex-col justify-between">
          <span className="text-[11px] font-mono text-emerald-400 uppercase">Export & Capture</span>
          <div className="flex items-center space-x-2 mt-1">
            <button
              onClick={handleDownloadKml}
              className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-semibold flex items-center space-x-1"
              title="Download output.kml for Google Maps"
            >
              <Download className="w-3 h-3" />
              <span>output.kml</span>
            </button>
            <label className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-mono cursor-pointer flex items-center space-x-1">
              <Upload className="w-3 h-3" />
              <span>.pcap</span>
              <input
                type="file"
                accept=".pcap,.cap,.pcapng"
                onChange={handlePcapUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {activeSubTab === 'map_and_packets' && (
        <div className="space-y-6">
          {/* Interactive Leaflet Map */}
          <div className="rounded-xl bg-slate-950 border border-cyber-border overflow-hidden shadow-xl">
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white">Geographic IP Tracking Map</span>
                <span className="text-[11px] font-mono text-slate-400">({publicIpsCount} Geocoded Pins)</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownloadGeoJson}
                  className="text-[11px] font-mono text-slate-400 hover:text-cyan-400 flex items-center space-x-1"
                >
                  <Download className="w-3 h-3" />
                  <span>GeoJSON</span>
                </button>
              </div>
            </div>

            <div className="relative w-full h-80 sm:h-96">
              <div ref={mapContainerRef} className="w-full h-full" />

              {/* Map Floating Info Box */}
              {selectedGeo && (
                <div className="absolute bottom-4 left-4 z-[1000] p-3 rounded-lg bg-slate-900/95 border border-slate-700 text-xs text-slate-200 max-w-sm shadow-2xl backdrop-blur">
                  <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-800">
                    <span className="font-bold text-emerald-400 font-mono">{selectedGeo.ip}</span>
                    <button onClick={() => setSelectedGeo(null)} className="text-slate-400 hover:text-white">✕</button>
                  </div>
                  <div className="space-y-0.5 text-[11px]">
                    <div><span className="text-slate-400">Location:</span> {selectedGeo.city}, {selectedGeo.country}</div>
                    <div><span className="text-slate-400">ASN / Org:</span> {selectedGeo.org}</div>
                    <div><span className="text-slate-400">Coordinates:</span> {selectedGeo.lat.toFixed(4)}, {selectedGeo.lon.toFixed(4)}</div>
                    <div><span className="text-slate-400">Packets in Capture:</span> {selectedGeo.packetCount}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Wireshark-Style Packet Dissection Table */}
          <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Wireshark Packet Stream</h3>
                <span className="text-xs font-mono text-slate-400">({filteredPackets.length} of {packets.length})</span>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search IP, port, protocol..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 w-44 sm:w-56"
                  />
                </div>

                {/* Protocol Filter */}
                <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
                  {['ALL', 'TCP', 'UDP', 'DNS', 'TLS'].map((proto) => (
                    <button
                      key={proto}
                      onClick={() => setProtocolFilter(proto)}
                      className={`px-2 py-0.5 rounded ${
                        protocolFilter === proto
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {proto}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Packet Table */}
            <div className="overflow-x-auto max-h-80 overflow-y-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3 w-14">No.</th>
                    <th className="py-2 px-3 w-20">Time</th>
                    <th className="py-2 px-3">Source IP</th>
                    <th className="py-2 px-3">Destination IP</th>
                    <th className="py-2 px-3 w-20">Protocol</th>
                    <th className="py-2 px-3 w-16">Length</th>
                    <th className="py-2 px-3">Info</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredPackets.map((pkt) => {
                    const isSelected = selectedPacket?.frameNumber === pkt.frameNumber;
                    return (
                      <tr
                        key={pkt.frameNumber}
                        onClick={() => setSelectedPacket(pkt)}
                        className={`cursor-pointer transition hover:bg-slate-800/50 ${
                          isSelected ? 'bg-cyan-500/15 text-cyan-200' : ''
                        }`}
                      >
                        <td className="py-2 px-3 text-slate-500">{pkt.frameNumber}</td>
                        <td className="py-2 px-3 text-slate-400">{pkt.timeFormatted}</td>
                        <td className="py-2 px-3 font-semibold text-slate-200">{pkt.srcIp}</td>
                        <td className="py-2 px-3 font-semibold text-slate-200">{pkt.dstIp}</td>
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            pkt.protocol.includes('TCP') ? 'bg-blue-500/20 text-blue-300' :
                            pkt.protocol.includes('TLS') ? 'bg-emerald-500/20 text-emerald-300' :
                            pkt.protocol.includes('DNS') ? 'bg-purple-500/20 text-purple-300' :
                            'bg-amber-500/20 text-amber-300'
                          }`}>
                            {pkt.protocol}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-400">{pkt.length}</td>
                        <td className="py-2 px-3 truncate max-w-xs sm:max-w-md text-slate-400">{pkt.info}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Selected Packet Detailed Dissection Inspector */}
            {selectedPacket && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">Frame {selectedPacket.frameNumber} Dissection:</span>
                    <span className="text-xs font-mono text-cyan-400">{selectedPacket.srcIp} → {selectedPacket.dstIp}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">{selectedPacket.length} bytes captured</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 space-y-1">
                    <div className="text-[11px] text-cyan-400 font-bold">Layer 2: Ethernet II</div>
                    <div className="text-slate-400 text-[11px]">Type: IPv4 (0x0800)</div>
                    <div className="text-slate-400 text-[11px]">Packet Wire Length: {selectedPacket.length}</div>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 space-y-1">
                    <div className="text-[11px] text-emerald-400 font-bold">Layer 3: Internet Protocol v4</div>
                    <div className="text-slate-400 text-[11px]">Src: {selectedPacket.srcIp}</div>
                    <div className="text-slate-400 text-[11px]">Dst: {selectedPacket.dstIp}</div>
                    <div className="text-slate-400 text-[11px]">Protocol: {selectedPacket.protocol}</div>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 space-y-1">
                    <div className="text-[11px] text-purple-400 font-bold">Layer 4: Transport</div>
                    <div className="text-slate-400 text-[11px]">
                      Ports: {selectedPacket.srcPort || 'N/A'} → {selectedPacket.dstPort || 'N/A'}
                    </div>
                    <div className="text-slate-400 text-[11px] truncate">Info: {selectedPacket.info}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Extracted IP Table Tab */}
      {activeSubTab === 'ip_table' && (
        <div className="p-6 rounded-xl bg-cyber-card border border-cyber-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Extracted IP Address Geolocation Inventory</h3>
              <p className="text-xs text-slate-400 mt-1">
                All unique source and destination IPs discovered in the capture and resolved against GeoLite2
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownloadKml}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export KML</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">City / Region</th>
                  <th className="py-2.5 px-3">Country</th>
                  <th className="py-2.5 px-3">Coordinates (Lat, Lon)</th>
                  <th className="py-2.5 px-3">Organization / ASN</th>
                  <th className="py-2.5 px-3 text-right">Packets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {geoIps.map((geo) => (
                  <tr key={geo.ip} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-bold text-white">{geo.ip}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        geo.isPrivate
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {geo.isPrivate ? 'Internal LAN' : 'Public WAN'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{geo.city}</td>
                    <td className="py-2.5 px-3 text-slate-300">{geo.country}</td>
                    <td className="py-2.5 px-3 text-cyan-400">
                      {geo.lat !== 0 ? `${geo.lat.toFixed(4)}, ${geo.lon.toFixed(4)}` : 'N/A (Local)'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{geo.org}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-200">{geo.packetCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Python Code Tab */}
      {activeSubTab === 'python_code' && (
        <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-slate-200">
              Network Tracking using Wireshark and Google Maps/main.py
            </span>
            <button
              onClick={() => copyToClipboard(`import pyshark
import geoip2.database
from fastkml import kml
from shapely.geometry import Point

PCAP_FILE = "wire.pcap"
GEO_DB_PATH = "GeoLite2-City.mmdb"
OUTPUT_KML_PATH = "output.kml"

def extract_ips(pcap_file):
    cap = pyshark.FileCapture(pcap_file, display_filter="ip")
    ip_addresses = set()
    for packet in cap:
        if hasattr(packet, 'ip'):
            ip_addresses.add(packet.ip.src)
            ip_addresses.add(packet.ip.dst)
    cap.close()
    return ip_addresses

def get_ip_location(ip_addresses, geo_db_path):
    ip_locations = {}
    with geoip2.database.Reader(geo_db_path) as reader:
        for ip in ip_addresses:
            try:
                response = reader.city(ip)
                lat, lon = response.location.latitude, response.location.longitude
                ip_locations[ip] = (lat, lon)
                print(f"📍 {ip} → {lat}, {lon}")
            except Exception:
                pass
    return ip_locations

def save_to_kml(ip_locations, output_path):
    k = kml.KML()
    doc = kml.Document(ns="")  
    folder = kml.Folder(ns="", id="Network_Tracking", name="Network Tracking Data")
    doc.append(folder)  
    k.append(doc)  

    for ip, (lat, lon) in ip_locations.items():
        placemark = kml.Placemark(ns="", id=ip, name=ip)  
        placemark.set_geometry(Point(float(lon), float(lat)))  
        folder.append(placemark)  

    with open(output_path, 'w', encoding="utf-8") as f:
        f.write(k.to_string())
    print(f"✅ KML file successfully saved at: {output_path}")

ip_addresses = extract_ips(PCAP_FILE)
if ip_addresses:
    ip_locations = get_ip_location(ip_addresses, GEO_DB_PATH)
    if ip_locations:
        save_to_kml(ip_locations, OUTPUT_KML_PATH)
`, 'main_py')}
              className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200"
            >
              {copiedCode === 'main_py' ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode === 'main_py' ? 'Copied' : 'Copy Python'}</span>
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`import pyshark
import geoip2.database
from fastkml import kml
from shapely.geometry import Point

PCAP_FILE = "wire.pcap"
GEO_DB_PATH = "GeoLite2-City.mmdb"
OUTPUT_KML_PATH = "output.kml"

# Extract IP addresses from PCAP
def extract_ips(pcap_file):
    cap = pyshark.FileCapture(pcap_file, display_filter="ip")
    ip_addresses = set()
    for packet in cap:
        if hasattr(packet, 'ip'):
            ip_addresses.add(packet.ip.src)
            ip_addresses.add(packet.ip.dst)
    cap.close()
    return ip_addresses

# Get geolocation of IPs using MaxMind GeoIP2
def get_ip_location(ip_addresses, geo_db_path):
    ip_locations = {}
    with geoip2.database.Reader(geo_db_path) as reader:
        for ip in ip_addresses:
            try:
                response = reader.city(ip)
                lat, lon = response.location.latitude, response.location.longitude
                ip_locations[ip] = (lat, lon)
                print(f"📍 {ip} → {lat}, {lon}")
            except Exception:
                pass  # Ignore private/local IPs
    return ip_locations

# Save extracted locations to Google Earth / Maps KML format
def save_to_kml(ip_locations, output_path):
    k = kml.KML()
    doc = kml.Document(ns="")  
    folder = kml.Folder(ns="", id="Network_Tracking", name="Network Tracking Data")
    doc.append(folder)  
    k.append(doc)  

    for ip, (lat, lon) in ip_locations.items():
        placemark = kml.Placemark(ns="", id=ip, name=ip)  
        placemark.set_geometry(Point(float(lon), float(lat)))  
        folder.append(placemark)  

    with open(output_path, 'w', encoding="utf-8") as f:
        f.write(k.to_string())
    print(f"✅ KML file successfully saved at: {output_path}")

ip_addresses = extract_ips(PCAP_FILE)
if ip_addresses:
    ip_locations = get_ip_location(ip_addresses, GEO_DB_PATH)
    if ip_locations:
        save_to_kml(ip_locations, OUTPUT_KML_PATH)`}
          </pre>
        </div>
      )}
    </div>
  );
};
