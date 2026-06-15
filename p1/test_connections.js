const { MongoClient } = require('mongodb');

async function testNextJsMongo() {
  console.log("=== Testing Next.js MongoDB Connection ===");
  let rootUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agri-tech-ai';
  console.log(`Using URI: ${rootUri}`);
  
  try {
    const client = new MongoClient(rootUri, { serverSelectionTimeoutMS: 2000 });
    await client.connect();
    console.log("🟢 Next.js MongoDB connection SUCCESSFUL!");
    const db = client.db('agri-tech-ai');
    const collections = await db.listCollections().toArray();
    console.log("Available collections:", collections.map(c => c.name));
    await client.close();
  } catch (err) {
    console.error("🔴 Next.js MongoDB connection FAILED:", err.message);
  }
}

testNextJsMongo();
