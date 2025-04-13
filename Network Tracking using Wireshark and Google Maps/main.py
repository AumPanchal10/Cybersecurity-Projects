import pyshark
import geoip2.database
from fastkml import kml
from shapely.geometry import Point

# Define file paths
PCAP_FILE = "C:/Users/aumpa/OneDrive/Desktop/Cyber Projects/Network Tracking Using Wireshark and Google Maps/data/wire.pcap"
GEO_DB_PATH = "C:/Users/aumpa/OneDrive/Desktop/Cyber Projects/Network Tracking Using Wireshark and Google Maps/data/GeoLite2-City.mmdb"
OUTPUT_KML_PATH = "C:/Users/aumpa/OneDrive/Desktop/Cyber Projects/Network Tracking Using Wireshark and Google Maps/data/output.kml"

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

# Get geolocation of IPs
def get_ip_location(ip_addresses, geo_db_path):
    ip_locations = {}

    with geoip2.database.Reader(geo_db_path) as reader:
        for ip in ip_addresses:
            try:
                response = reader.city(ip)
                lat, lon = response.location.latitude, response.location.longitude
                ip_locations[ip] = (lat, lon)
                print(f"📍 {ip} → {lat}, {lon}")  # Log output
            except Exception:
                pass  # Ignore private/local IPs

    return ip_locations

# Save extracted locations to KML
def save_to_kml(ip_locations, output_path):
    k = kml.KML()
    doc = kml.Document(ns="")  
    folder = kml.Folder(ns="", id="Network_Tracking", name="Network Tracking Data")
    doc.append(folder)  
    k.append(doc)  

    for ip, (lat, lon) in ip_locations.items():
        placemark = kml.Placemark(ns="", id=ip, name=ip)  
        placemark.set_geometry(Point(float(lon), float(lat)))  # ✅ Correct way to set geometry  
        folder.append(placemark)  

    with open(output_path, 'w', encoding="utf-8") as f:
        f.write(k.to_string())

    print(f"✅ KML file successfully saved at: {output_path}")

# Run the script
ip_addresses = extract_ips(PCAP_FILE)

if ip_addresses:
    ip_locations = get_ip_location(ip_addresses, GEO_DB_PATH)
    if ip_locations:
        save_to_kml(ip_locations, OUTPUT_KML_PATH)
    else:
        print("⚠ No valid IP locations found.")
else:
    print("⚠ No valid network data found in the PCAP file.")
