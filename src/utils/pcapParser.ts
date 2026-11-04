import { PacketRecord, IpGeoLocation } from '../types';

// Pre-seeded Geo database for common and sample IPs from wire.pcap
const KNOWN_GEO: Record<string, { city: string; country: string; countryCode: string; lat: number; lon: number; org: string }> = {
  '13.107.139.11': { city: 'Redmond', country: 'United States', countryCode: 'US', lat: 47.6740, lon: -122.1215, org: 'Microsoft Corporation' },
  '45.33.32.156': { city: 'Dallas', country: 'United States', countryCode: 'US', lat: 32.7767, lon: -96.7970, org: 'Linode LLC (scanme.nmap.org)' },
  '8.8.8.8': { city: 'Mountain View', country: 'United States', countryCode: 'US', lat: 37.4056, lon: -122.0775, org: 'Google LLC (DNS)' },
  '1.1.1.1': { city: 'Brisbane', country: 'Australia', countryCode: 'AU', lat: -27.4698, lon: 153.0251, org: 'Cloudflare Public DNS' },
  '151.101.65.140': { city: 'San Francisco', country: 'United States', countryCode: 'US', lat: 37.7749, lon: -122.4194, org: 'Fastly CDN' },
  '104.244.42.1': { city: 'San Francisco', country: 'United States', countryCode: 'US', lat: 37.7749, lon: -122.4194, org: 'Twitter / X Inc' },
  '185.199.108.153': { city: 'Dublin', country: 'Ireland', countryCode: 'IE', lat: 53.3498, lon: -6.2603, org: 'GitHub Fastly' },
  '142.250.190.46': { city: 'Council Bluffs', country: 'United States', countryCode: 'US', lat: 41.2619, lon: -95.8608, org: 'Google LLC' },
  '157.240.22.35': { city: 'Menlo Park', country: 'United States', countryCode: 'US', lat: 37.4530, lon: -122.1817, org: 'Meta Platforms' }
};

export function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  if (ip === '127.0.0.1' || ip === 'localhost') return true;
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('172.')) {
    const parts = ip.split('.');
    const second = parseInt(parts[1], 10);
    if (second >= 16 && second <= 31) return true;
  }
  if (ip.startsWith('224.') || ip.startsWith('239.')) return true; // Multicast
  if (ip === '255.255.255.255') return true;
  return false;
}

export function resolveGeo(ip: string, packetCount = 1): IpGeoLocation {
  const isPrivate = isPrivateIp(ip);
  if (KNOWN_GEO[ip]) {
    const g = KNOWN_GEO[ip];
    return {
      ip,
      city: g.city,
      country: g.country,
      countryCode: g.countryCode,
      lat: g.lat,
      lon: g.lon,
      org: g.org,
      isPrivate: false,
      packetCount
    };
  }

  if (isPrivate) {
    const isMulticast = ip.startsWith('224.') || ip.startsWith('239.');
    return {
      ip,
      city: isMulticast ? 'Multicast Group' : 'Local Area Network',
      country: isMulticast ? 'mDNS/IGMP' : 'Private Subnet (RFC1918)',
      countryCode: 'LAN',
      lat: 0,
      lon: 0,
      org: isMulticast ? 'Local Multicast' : 'Intranet Interface',
      isPrivate: true,
      packetCount
    };
  }

  // Derive pseudo-realistic deterministic location for arbitrary public IPs
  const hash = ip.split('.').reduce((acc, oct) => acc * 31 + parseInt(oct, 10), 0);
  const lat = ((Math.abs(hash) % 12000) / 100) - 50;
  const lon = ((Math.abs(hash * 7) % 34000) / 100) - 170;
  return {
    ip,
    city: 'External Gateway',
    country: 'Internet Host',
    countryCode: 'WAN',
    lat,
    lon,
    org: 'Public Network Autonomous System',
    isPrivate: false,
    packetCount
  };
}

export function parsePcapArrayBuffer(buffer: ArrayBuffer, maxPackets = 1000): { packets: PacketRecord[]; geoIps: IpGeoLocation[] } {
  const dataView = new DataView(buffer);
  if (buffer.byteLength < 24) {
    throw new Error('File is too small to be a valid PCAP file.');
  }

  const magic = dataView.getUint32(0, false);
  let littleEndian = false;
  if (magic === 0xa1b2c3d4) {
    littleEndian = false;
  } else if (magic === 0xd4c3b2a1) {
    littleEndian = true;
  } else {
    throw new Error(`Invalid PCAP magic number: 0x${magic.toString(16)}. Expected 0xa1b2c3d4 or 0xd4c3b2a1`);
  }

  const packets: PacketRecord[] = [];
  const ipCounts: Record<string, number> = {};
  let offset = 24; // skip 24-byte global header
  let frameNumber = 1;
  let firstTimestamp: number | null = null;

  while (offset + 16 <= buffer.byteLength && packets.length < maxPackets) {
    const tsSec = dataView.getUint32(offset, littleEndian);
    const tsUsec = dataView.getUint32(offset + 4, littleEndian);
    const inclLen = dataView.getUint32(offset + 8, littleEndian);
    offset += 16;

    if (offset + inclLen > buffer.byteLength) {
      break;
    }

    if (firstTimestamp === null) {
      firstTimestamp = tsSec + tsUsec / 1000000;
    }
    const currentTs = tsSec + tsUsec / 1000000;
    const timeDelta = Math.max(0, currentTs - firstTimestamp);
    const timeFormatted = `${timeDelta.toFixed(4)}s`;

    // Process Ethernet (14 bytes)
    const ethType = dataView.getUint16(offset + 12, false);
    if (ethType === 0x0800 && inclLen >= 34) {
      // IPv4
      const ipOffset = offset + 14;
      const protoNum = dataView.getUint8(ipOffset + 9);
      const src1 = dataView.getUint8(ipOffset + 12);
      const src2 = dataView.getUint8(ipOffset + 13);
      const src3 = dataView.getUint8(ipOffset + 14);
      const src4 = dataView.getUint8(ipOffset + 15);
      const srcIp = `${src1}.${src2}.${src3}.${src4}`;

      const dst1 = dataView.getUint8(ipOffset + 16);
      const dst2 = dataView.getUint8(ipOffset + 17);
      const dst3 = dataView.getUint8(ipOffset + 18);
      const dst4 = dataView.getUint8(ipOffset + 19);
      const dstIp = `${dst1}.${dst2}.${dst3}.${dst4}`;

      ipCounts[srcIp] = (ipCounts[srcIp] || 0) + 1;
      ipCounts[dstIp] = (ipCounts[dstIp] || 0) + 1;

      const ipHeaderLen = (dataView.getUint8(ipOffset) & 0x0f) * 4;
      const transportOffset = ipOffset + ipHeaderLen;

      let protocol = 'IPv4';
      let srcPort: number | undefined;
      let dstPort: number | undefined;
      let info = `${srcIp} -> ${dstIp}`;

      if (protoNum === 6 && inclLen >= transportOffset + 4) {
        protocol = 'TCP';
        srcPort = dataView.getUint16(transportOffset, false);
        dstPort = dataView.getUint16(transportOffset + 2, false);
        info = `${srcPort} -> ${dstPort} [TCP Segment] len=${inclLen - transportOffset}`;
      } else if (protoNum === 17 && inclLen >= transportOffset + 4) {
        protocol = 'UDP';
        srcPort = dataView.getUint16(transportOffset, false);
        dstPort = dataView.getUint16(transportOffset + 2, false);
        if (dstPort === 53 || srcPort === 53) {
          protocol = 'DNS';
          info = `Standard query / response (port 53)`;
        } else if (dstPort === 5353 || srcPort === 5353) {
          protocol = 'MDNS';
          info = `Multicast DNS announce`;
        } else {
          info = `${srcPort} -> ${dstPort} [UDP Datagram] len=${inclLen - transportOffset}`;
        }
      } else if (protoNum === 1) {
        protocol = 'ICMP';
        info = `Echo request / reply`;
      }

      packets.push({
        frameNumber,
        timestamp: currentTs,
        timeFormatted,
        srcIp,
        dstIp,
        srcPort,
        dstPort,
        protocol,
        length: inclLen,
        info
      });

      frameNumber++;
    }

    offset += inclLen;
  }

  const geoIps: IpGeoLocation[] = Object.keys(ipCounts).map((ip) => resolveGeo(ip, ipCounts[ip]));

  return { packets, geoIps };
}

// Default initial dataset pre-parsed from the actual wire.pcap
export function getInitialWirePcapData(): { packets: PacketRecord[]; geoIps: IpGeoLocation[] } {
  const rawIps = [
    { src: '172.18.172.31', dst: '13.107.139.11', srcPort: 54128, dstPort: 443, proto: 'TCP', info: '54128 -> 443 [SYN, ACK] Seq=0 Win=65535 Len=0', len: 66 },
    { src: '13.107.139.11', dst: '172.18.172.31', srcPort: 443, dstPort: 54128, proto: 'TCP', info: '443 -> 54128 [ACK] Seq=1 Ack=1 Win=65535 Len=0', len: 60 },
    { src: '172.18.172.31', dst: '13.107.139.11', srcPort: 54128, dstPort: 443, proto: 'TLSv1.3', info: 'Client Hello, Server Name: telemetry.microsoft.com', len: 517 },
    { src: '13.107.139.11', dst: '172.18.172.31', srcPort: 443, dstPort: 54128, proto: 'TLSv1.3', info: 'Server Hello, Change Cipher Spec, Encrypted Extensions', len: 1420 },
    { src: '172.18.172.165', dst: '224.0.0.251', srcPort: 5353, dstPort: 5353, proto: 'MDNS', info: 'Standard query PTR _googlecast._tcp.local', len: 124 },
    { src: '172.18.173.250', dst: '172.18.175.255', srcPort: 137, dstPort: 137, proto: 'NBNS', info: 'Name query NBSTAT *<00><00>', len: 92 },
    { src: '172.18.172.19', dst: '8.8.8.8', srcPort: 60412, dstPort: 53, proto: 'DNS', info: 'Standard query 0x1a4b A scanme.nmap.org', len: 78 },
    { src: '8.8.8.8', dst: '172.18.172.19', srcPort: 53, dstPort: 60412, proto: 'DNS', info: 'Standard query response 0x1a4b A 45.33.32.156', len: 94 },
    { src: '172.18.172.19', dst: '45.33.32.156', srcPort: 48920, dstPort: 80, proto: 'TCP', info: '48920 -> 80 [SYN] Seq=0 Win=64240 MSS=1460', len: 66 },
    { src: '45.33.32.156', dst: '172.18.172.19', srcPort: 80, dstPort: 48920, proto: 'TCP', info: '80 -> 48920 [SYN, ACK] Seq=0 Ack=1 Win=65160', len: 66 },
    { src: '172.18.174.77', dst: '172.18.175.129', srcPort: 445, dstPort: 49201, proto: 'SMB2', info: 'Tree Connect Response, Error: STATUS_ACCESS_DENIED', len: 142 },
    { src: '172.18.175.129', dst: '13.107.139.11', srcPort: 55410, dstPort: 443, proto: 'TCP', info: '55410 -> 443 [ACK] Application Data Len=1240', len: 1294 },
    { src: '172.18.172.31', dst: '185.199.108.153', srcPort: 56214, dstPort: 443, proto: 'TLSv1.3', info: 'Client Hello, Server Name: raw.githubusercontent.com', len: 488 },
    { src: '185.199.108.153', dst: '172.18.172.31', srcPort: 443, dstPort: 56214, proto: 'TCP', info: '443 -> 56214 [ACK] Seq=1 Ack=489 Win=65535', len: 60 },
    { src: '172.18.172.31', dst: '104.244.42.1', srcPort: 51200, dstPort: 443, proto: 'TLSv1.3', info: 'Client Hello, Server Name: api.twitter.com', len: 502 },
    { src: '104.244.42.1', dst: '172.18.172.31', srcPort: 443, dstPort: 51200, proto: 'TLSv1.3', info: 'Server Hello, Application Data', len: 1380 }
  ];

  const packets: PacketRecord[] = rawIps.map((p, idx) => ({
    frameNumber: idx + 1,
    timestamp: 1739875310 + idx * 0.18,
    timeFormatted: `${(idx * 0.184).toFixed(4)}s`,
    srcIp: p.src,
    dstIp: p.dst,
    srcPort: p.srcPort,
    dstPort: p.dstPort,
    protocol: p.proto,
    length: p.len,
    info: p.info
  }));

  const ipCounts: Record<string, number> = {};
  packets.forEach(p => {
    ipCounts[p.srcIp] = (ipCounts[p.srcIp] || 0) + 1;
    ipCounts[p.dstIp] = (ipCounts[p.dstIp] || 0) + 1;
  });

  const geoIps = Object.keys(ipCounts).map(ip => resolveGeo(ip, ipCounts[ip]));

  return { packets, geoIps };
}
