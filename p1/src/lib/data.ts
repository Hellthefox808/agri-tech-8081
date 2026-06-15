export interface FarmNode {
  id: string;
  name: string;
  fpo_id: string;
  soil: string;
  zone: string;
  elev: number;
  lat: number;
  lng: number;
  coast: number;
  dev: string;
}

export const FARM_NODES: FarmNode[] = [
  { id: "FN-001", name: "Green Valley Organic Farm", fpo_id: "FPO-SYD", soil: "Clay Loam", zone: "Zone A", elev: 45.0, lat: 17.3850, lng: 73.9500, coast: 18.5, dev: "ESP32-A1F3" },
  { id: "FN-002", name: "Sunrise Spice Plantation", fpo_id: "FPO-SYD", soil: "Alluvial", zone: "Zone B", elev: 120.0, lat: 17.4200, lng: 73.8800, coast: 25.2, dev: "ESP32-B2G4" },
  { id: "FN-003", name: "Golden Harvest Paddy Field", fpo_id: "FPO-KKN", soil: "Clayey", zone: "Zone A", elev: 12.0, lat: 17.3500, lng: 74.0200, coast: 8.3, dev: "JN-001" },
  { id: "FN-004", name: "Misty Hills Tea Estate", fpo_id: "FPO-KKN", soil: "Laterite", zone: "Zone C", elev: 580.0, lat: 17.4800, lng: 73.7500, coast: 42.0, dev: "ESP32-D4J6" },
  { id: "FN-005", name: "Coconut Grove Coastal Farm", fpo_id: "FPO-CST", soil: "Sandy", zone: "Zone B", elev: 5.0, lat: 17.3100, lng: 73.9900, coast: 3.2, dev: "ESP32-E5K7" },
  { id: "FN-006", name: "Mango Valley Orchard", fpo_id: "FPO-CST", soil: "Loamy", zone: "Zone D", elev: 75.0, lat: 17.2700, lng: 74.0800, coast: 15.8, dev: "ESP32-F6L8" },
  { id: "FN-007", name: "Cashew Coast Plantation", fpo_id: "FPO-CST", soil: "Gravelly", zone: "Zone A", elev: 18.0, lat: 17.2400, lng: 73.9600, coast: 5.5, dev: "ESP32-H8N0" }
];
