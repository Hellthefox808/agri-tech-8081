const mongoose = require('mongoose');
const fs = require('fs');

async function testRentalsMongo() {
  console.log("=== Testing Rentals-main MongoDB Connection ===");
  const envPath = "./.env";
  let dbUrl = 'mongodb://127.0.0.1:27017/wanderlust';
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/MONGODB_URI=(.+)/);
    if (match) {
      dbUrl = match[1].trim();
    }
  }
  
  console.log(`Using URI: ${dbUrl}`);
  try {
    await mongoose.connect(dbUrl, { serverSelectionTimeoutMS: 2000 });
    console.log("🟢 Rentals-main MongoDB connection SUCCESSFUL!");
    await mongoose.disconnect();
  } catch (err) {
    console.error("🔴 Rentals-main MongoDB connection FAILED:", err.message);
  }
}

testRentalsMongo();
