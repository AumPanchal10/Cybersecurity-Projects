export type ProjectTab = 'fuzzer' | 'tracking' | 'nmap' | 'wifi' | 'overview';

// API Fuzzer Types
export interface FuzzWordResult {
  id: string;
  word: string;
  url: string;
  statusCode: number;
  statusText: string;
  durationMs: number;
  responseSize: number;
  responseBody: string;
  timestamp: string;
  isCustomSuccess?: boolean;
}

export interface MockEndpointConfig {
  word: string;
  status: number;
  response: Record<string, any>;
}

// Network Tracking Types
export interface PacketRecord {
  frameNumber: number;
  timestamp: number;
  timeFormatted: string;
  srcIp: string;
  dstIp: string;
  srcPort?: number;
  dstPort?: number;
  protocol: string;
  length: number;
  info: string;
  srcGeo?: IpGeoLocation;
  dstGeo?: IpGeoLocation;
}

export interface IpGeoLocation {
  ip: string;
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  org: string;
  isPrivate: boolean;
  packetCount: number;
}

// Nmap Scanner Types
export interface PortScanResult {
  port: number;
  protocol: string;
  state: 'open' | 'filtered' | 'closed';
  service: string;
  version?: string;
  reason: string;
  ttl?: number;
}

export interface HostScanReport {
  target: string;
  ip: string;
  status: 'up' | 'down';
  latencyMs: number;
  scannedPorts: number;
  openPorts: number;
  timestamp: string;
  elapsedSec: number;
  ports: PortScanResult[];
  rawJson?: Record<string, any>;
}

// WiFi Sniffing Types
export interface ProbeRequest {
  id: string;
  timestamp: string;
  macAddress: string;
  vendor: string;
  ssid: string;
  rssi: number;
  channel: number;
  band: '2.4 GHz' | '5 GHz';
  seqNumber: number;
}
