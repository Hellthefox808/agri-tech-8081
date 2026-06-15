import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function reconcileTelemetry(deviceId: string, payload: any) {
  const records = payload.records || [];
  const { db } = await connectToDatabase();

  if (records.length > 0) {
    const docs = records.map((rec: any) => ({
      device_id: deviceId,
      timestamp: rec.recorded_at || rec.timestamp,
      temperature_c: rec.temperature ?? rec.temperature_c,
      humidity_rh: rec.humidity ?? rec.humidity_rh,
      co2_ppm: rec.co2_ppm,
      soil_moisture_pct: rec.soil_moisture ?? rec.soil_moisture_pct,
      soil_ph: rec.soil_ph,
      soil_ec: rec.soil_ec
    }));

    await db.collection('sensor_logs').insertMany(docs);
  }

  return NextResponse.json({
    device_id: deviceId,
    records_imported: records.length,
    status: "SUCCESS"
  });
}
