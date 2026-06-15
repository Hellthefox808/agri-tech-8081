import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { FARM_NODES } from '@/lib/data';

export async function getSpatialAnalytics(fpoId: string | null) {
  const { db } = await connectToDatabase();
  const geoProfiles = await db.collection('geo_profiles').find({}).toArray();

  const features = await Promise.all(
    geoProfiles.map(async (f: any, index: number) => {
      const matchingFarm = FARM_NODES[index % FARM_NODES.length];

      // If FPO filter is applied, skip farms that do not match
      if (fpoId && matchingFarm.fpo_id !== fpoId) {
        return null;
      }

      // Calculate avg risk from batches
      const farmBatches = await db.collection('batches').find({ farm_id: matchingFarm.id }).toArray();
      const avgRisk = farmBatches.length > 0
        ? farmBatches.reduce((s, b) => s + b.risk_score, 0) / farmBatches.length
        : 12.0;

      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [f.lon, f.lat]
        },
        properties: {
          farm_id: matchingFarm.id,
          farm_name: matchingFarm.name,
          soil_type: f.soil_type,
          coast_distance_km: f.distance_from_ocean_km,
          elevation_m: f.elevation_m,
          active_spoilage_risk: Number(avgRisk.toFixed(2)),
          source_elevation: f.elevation_source || "OpenTopography / SRTM",
          source_coastline: f.coastline_boundary_source || "Natural Earth"
        }
      };
    })
  );

  // Filter out null profiles (which didn't match fpo_id)
  const filteredFeatures = features.filter(f => f !== null);

  return NextResponse.json({
    type: "FeatureCollection",
    features: filteredFeatures
  });
}
