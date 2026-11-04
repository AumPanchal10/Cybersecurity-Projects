# Cybersecurity Projects Studio

An interactive React application rewritten from the GitHub repository [AumPanchal10/Cybersecurity-Projects](https://github.com/AumPanchal10/Cybersecurity-Projects).

This centralized cybersecurity suite provides interactive environments, forensic analysis tools, network geolocation visualization, and script automation for educational and defensive security research.

---

## 🛡️ Ported Modules & Features

### 1. 🔍 REST API Fuzzer
- **Source Module:** `API Fuzzer` (`main.py`, `server.py`, `words.txt`)
- **Features:**
  - Automated path brute-forcing and endpoint discovery against target base URLs.
  - Interactive dictionary management loaded from the original `words.txt` with support for custom wordlists, presets, and text file uploads.
  - Built-in simulated Flask REST API server mimicking `server.py` with customizable endpoints (`/api/test`, `/api/health`, `/api/admin`, `/api/users`).
  - Real-time response code metrics (200 OK, 404 Not Found, 403 Forbidden, 500 Server Error).
  - Terminal log feed reproducing `main.py` output with color-coded response badges and JSON payload inspector.
  - JSON results export and original Python script exporter.

### 2. 🌍 Network Tracking (Wireshark PCAP & Google Maps)
- **Source Module:** `Network Tracking using Wireshark and Google Maps` (`wire.pcap`, `main.py`, `desc.txt`)
- **Features:**
  - In-browser binary PCAP parser decoding Ethernet, IPv4, TCP, UDP, TLS, DNS, and MDNS headers.
  - Loads the authentic `wire.pcap` sample capture with drag-and-drop support for custom `.pcap` files.
  - Interactive Leaflet world map with cyber dark basemap styling, glowing IP location pins, and packet frequency tooltips.
  - Wireshark-style packet dissection table with search, protocol filters, and deep-dive frame inspectors.
  - IP Geolocation inventory resolving public endpoints against geographic databases (Redmond WA, Dallas TX, Dublin, etc.).
  - **KML Exporter:** Implements the exact `save_to_kml` logic using fastkml formatting to generate `output.kml` for Google Earth / Google My Maps, alongside GeoJSON.

### 3. 🖥️ Nmap & Python Scripting Lab
- **Source Module:** `Nmap and Python Scripting` (`Process.text`, `1.png`, `2.png`)
- **Features:**
  - Authentic Kali Linux root terminal emulator (`root@Kali:~#`) reproducing the top-10 port scan of `scanme.nmap.org`.
  - Port Scanner interface analyzing open, filtered, and closed ports, service identification (SSH, HTTP, Telnet, FTP), and scan latency.
  - Python `python-nmap3` script generator with live JSON output viewer matching `2.png`.
  - Preserved original Kali Linux screenshots (`1.png` and `2.png`) with interactive modal viewing and tutorial walkthrough from `Process.text`.

### 4. 📶 802.11 WiFi Probe Sniffer
- **Source Module:** `Python WiFi Sniffing` (`sniffer.py`)
- **Features:**
  - 802.11 monitor mode probe request (`Dot11ProbeReq`) simulation and real-time capture feed on `wlan0mon`.
  - Unencrypted SSID discovery tracking wireless network queries broadcast by nearby devices.
  - Device footprint profiling: correlates client MAC addresses with OUI hardware vendors (Apple, Samsung, Intel, Google) and their probed SSIDs.
  - Privacy impact analysis highlighting risks of WiFi probe broadcasting and MAC randomization defenses.
  - Scapy Python script generator and Kali Linux execution reference.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm

### Development
```bash
npm install
npm run dev
```
The application will start on `http://localhost:3000`.

### Production Build
```bash
npm run build
npm run preview
```

---

## 🔒 Security & Educational Disclaimer
All network scanning, API fuzzing, and packet analysis simulations within this suite are strictly designed for authorized security research, educational exploration, and defensive hardening. Only scan systems and networks you own or have explicit authorization to audit.
