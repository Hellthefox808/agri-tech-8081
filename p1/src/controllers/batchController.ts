import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { FARM_NODES } from '@/lib/data';
import crypto from 'crypto';

export async function getBatches() {
  const { db } = await connectToDatabase();
  const batches = await db.collection('batches').find({}).sort({ created_at: -1 }).toArray();
  return NextResponse.json(batches);
}

export async function createBatch(payload: any) {
  const { db } = await connectToDatabase();

  const farmNode = FARM_NODES.find(f => f.dev === payload.device_id) || FARM_NODES[0];
  const hashContent = `${payload.device_id}-${payload.crop_type}-${payload.cultivar || ''}-${payload.quantity_kg}-${payload.harvest_date}-${payload.prev_batch_hash}`;
  const traceHash = crypto.createHash('sha256').update(hashContent).digest('hex');
  
  const batchId = crypto.randomUUID();
  const newBatch = {
    batch_id: batchId,
    device_id: String(payload.device_id).slice(0, 50),
    farm_id: farmNode.id,
    crop_type: String(payload.crop_type).slice(0, 100),
    plant_type: payload.crop_type === 'Tomato' ? 'Solanum lycopersicum' : 'Capsicum annuum',
    color_features: {
      mean_hue: 18.5,
      mean_saturation: 88.2,
      mean_value: 75.0,
      color_space: "HSV"
    },
    grade_mix: {
      A_pct: Number(payload.grade_distribution?.A_pct) || 82.5,
      B_pct: Number(payload.grade_distribution?.B_pct) || 12.0,
      C_pct: Number(payload.grade_distribution?.C_pct) || 4.5,
      R_pct: Number(payload.grade_distribution?.R_pct) || 1.0
    },
    farm_geo: {
      type: "Point",
      coordinates: [
        Number(payload.coordinates?.lng) || farmNode.lng,
        Number(payload.coordinates?.lat) || farmNode.lat
      ]
    },
    risk_score: Number(payload.spoilage_risk_score) || 12.0,
    traceability_hash_chain: traceHash,
    prev_batch_hash: String(payload.prev_batch_hash).slice(0, 64),
    created_at: new Date().toISOString()
  };

  await db.collection('batches').insertOne(newBatch);

  return NextResponse.json({
    batch_id: batchId,
    trace_hash: traceHash,
    created_at: newBatch.created_at,
    status: "RECORDED"
  }, { status: 201 });
}
