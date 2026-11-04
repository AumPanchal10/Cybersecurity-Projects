import { IpGeoLocation } from '../types';

export function generateKmlString(geoLocations: IpGeoLocation[]): string {
  const publicLocations = geoLocations.filter(g => !g.isPrivate && g.lat !== 0 && g.lon !== 0);

  const placemarks = publicLocations.map(loc => `    <Placemark id="${loc.ip}">
      <name>${loc.ip} - ${loc.city}, ${loc.country}</name>
      <description><![CDATA[
        <b>IP Address:</b> ${loc.ip}<br/>
        <b>Organization:</b> ${loc.org}<br/>
        <b>Location:</b> ${loc.city}, ${loc.country}<br/>
        <b>Coordinates:</b> ${loc.lat.toFixed(4)}, ${loc.lon.toFixed(4)}<br/>
        <b>Packets Captured:</b> ${loc.packetCount}
      ]]></description>
      <Point>
        <coordinates>${loc.lon},${loc.lat},0</coordinates>
      </Point>
    </Placemark>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Network Tracking Data</name>
    <description>Extracted IP Geolocation from Wireshark PCAP Capture</description>
    <Folder id="Network_Tracking">
      <name>Network Tracking Data</name>
${placemarks}
    </Folder>
  </Document>
</kml>`;
}

export function downloadFile(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateGeoJson(geoLocations: IpGeoLocation[]): string {
  const publicLocations = geoLocations.filter(g => !g.isPrivate && g.lat !== 0 && g.lon !== 0);
  const geojson = {
    type: "FeatureCollection",
    features: publicLocations.map(loc => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [loc.lon, loc.lat]
      },
      properties: {
        ip: loc.ip,
        city: loc.city,
        country: loc.country,
        organization: loc.org,
        packetCount: loc.packetCount
      }
    }))
  };
  return JSON.stringify(geojson, null, 2);
}
