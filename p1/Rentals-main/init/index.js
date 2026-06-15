const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const { data: sampleListings } = require("./data.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
  await mongoose.connect(MONGO_URL);
  console.log("Connected to DB");
}

async function initDB() {
  await main();
  await Listing.deleteMany({});
  console.log("Old data cleared.");
  await Listing.insertMany(sampleListings);
  console.log(`${sampleListings.length} listings inserted successfully.`);
  mongoose.connection.close();
  console.log("Done. DB connection closed.");
}

initDB();
