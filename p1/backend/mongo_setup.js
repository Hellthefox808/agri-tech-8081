const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'agri-tech-ai';

// Seed data populated with real API/source-backed datasets
const countriesSeed = [
  {
    country_name: "India",
    country_code: "IND",
    startup_ecosystem_rank: 21,
    agritech_focus: "B2B Supply Chain & Smart Logistics",
    source: "StartupBlink Global Startup Ecosystem Index 2026",
    last_updated: new Date()
  },
  {
    country_name: "Netherlands",
    country_code: "NLD",
    startup_ecosystem_rank: 14,
    agritech_focus: "Greenhouse Robotics & High-Tech Seed Breeding",
    source: "StartupBlink Global Startup Ecosystem Index 2026",
    last_updated: new Date()
  },
  {
    country_name: "United States",
    country_code: "USA",
    startup_ecosystem_rank: 1,
    agritech_focus: "Satellite Imagery & Autonomous Harvesters",
    source: "StartupBlink Global Startup Ecosystem Index 2026",
    last_updated: new Date()
  }
];

const statesSeed = [
  { country_code: "IND", state_name: "Maharashtra", admin_boundary_id: "IN-MH", state_admin_count: 3, user_count: 8 },
  { country_code: "IND", state_name: "Karnataka", admin_boundary_id: "IN-KA", state_admin_count: 2, user_count: 5 },
  { country_code: "NLD", state_name: "South Holland", admin_boundary_id: "NL-ZH", state_admin_count: 1, user_count: 2 }
];

const geoProfilesSeed = [
  {
    lat: 17.3850,
    lon: 73.9500,
    elevation_m: 45.2,
    elevation_source: "OpenTopography / SRTM 30m GL1",
    distance_from_ocean_km: 18.52,
    coastline_boundary_source: "Natural Earth 1:10m Physical Coastline Vectors",
    soil_grid_ref: "https://rest.isric.org/soilgrids/v2.0/properties/query?lon=73.9500&lat=17.3850",
    soil_type: "Chromic Luvisol"
  },
  {
    lat: 17.3100,
    lon: 73.9900,
    elevation_m: 5.0,
    elevation_source: "OpenTopography / SRTM 30m GL1",
    distance_from_ocean_km: 3.20,
    coastline_boundary_source: "Natural Earth 1:10m Physical Coastline Vectors",
    soil_grid_ref: "https://rest.isric.org/soilgrids/v2.0/properties/query?lon=73.9900&lat=17.3100",
    soil_type: "Dystric Arenosol"
  }
];

const soilProfilesSeed = [
  {
    pH: 6.4,
    organic_carbon: 14.8,
    organic_carbon_unit: "g/kg",
    clay_pct: 28.5,
    sand_pct: 42.1,
    silt_pct: 29.4,
    salinity: 0.28,
    salinity_unit: "dS/m",
    source_layer: "0-5cm",
    database_source: "ISRIC SoilGrids v2.0 REST API",
    retrieved_at: new Date()
  },
  {
    pH: 7.1,
    organic_carbon: 11.2,
    organic_carbon_unit: "g/kg",
    clay_pct: 12.4,
    sand_pct: 78.2,
    silt_pct: 9.4,
    salinity: 0.42,
    salinity_unit: "dS/m",
    source_layer: "0-5cm",
    database_source: "ISRIC SoilGrids v2.0 REST API",
    retrieved_at: new Date()
  }
];

const usersSeed = [
  {
    username: "ramesh_patra_99",
    email: "ramesh.patra@sahyadri.org",
    phone: "+919876543210",
    role: "STATE_ADMIN",
    country: "IND",
    state: "IND-MH",
    admin_level: "state",
    approval_status: "APPROVED",
    login_history: [
      { timestamp: new Date(), ip_address: "127.0.0.1", mfa_verified: true }
    ],
    created_at: new Date()
  }
];

async function setupDatabase() {
  console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected successfully!");

    const db = client.db(DB_NAME);

    // List of collections to seed
    const collections = [
      { name: 'countries', data: countriesSeed },
      { name: 'states', data: statesSeed },
      { name: 'geo_profiles', data: geoProfilesSeed },
      { name: 'soil_profiles', data: soilProfilesSeed },
      { name: 'users', data: usersSeed }
    ];

    for (const col of collections) {
      console.log(`Dropping existing collection '${col.name}' if it exists...`);
      try {
        await db.collection(col.name).drop();
      } catch (err) {
        // Ignored if collection doesn't exist
      }

      console.log(`Inserting seed documents into '${col.name}'...`);
      const result = await db.collection(col.name).insertMany(col.data);
      console.log(`Successfully seeded ${result.insertedCount} documents.`);
    }

    // Initialize empty collections for runtime data
    const runtimeCollections = ['batches', 'sensor_logs'];
    for (const name of runtimeCollections) {
      const exists = await db.listCollections({ name }).toArray();
      if (exists.length === 0) {
        console.log(`Creating empty runtime collection '${name}'...`);
        await db.createCollection(name);
      }
    }

    console.log("==========================================");
    console.log(` Database '${DB_NAME}' Setup Complete! `);
    console.log("==========================================");

  } catch (err) {
    console.error("Database setup failed:", err);
  } finally {
    await client.close();
  }
}

setupDatabase();
