const http = require('http');

function getUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function testEndpoints() {
  console.log("=== Testing Next.js API Endpoints ===");
  try {
    const batchesRes = await getUrl('http://127.0.0.1:8000/api/v1/batches');
    console.log(`GET /api/v1/batches: status = ${batchesRes.statusCode}`);
    if (batchesRes.statusCode === 200) {
      console.log("🟢 GET /api/v1/batches SUCCESSFUL!");
      console.log(`Sample batches count: ${JSON.parse(batchesRes.data).length}`);
    } else {
      console.error(`🔴 GET /api/v1/batches failed: ${batchesRes.data}`);
    }
  } catch (err) {
    console.error("🔴 GET /api/v1/batches connection error (is server running?):", err.message);
  }

  try {
    const spatialRes = await getUrl('http://127.0.0.1:8000/api/v1/farms/spatial-analytics');
    console.log(`GET /api/v1/farms/spatial-analytics: status = ${spatialRes.statusCode}`);
    if (spatialRes.statusCode === 200) {
      console.log("🟢 GET /api/v1/farms/spatial-analytics SUCCESSFUL!");
      console.log(`Features count: ${JSON.parse(spatialRes.data).features.length}`);
    } else {
      console.error(`🔴 GET /api/v1/farms/spatial-analytics failed: ${spatialRes.data}`);
    }
  } catch (err) {
    console.error("🔴 GET /api/v1/farms/spatial-analytics connection error:", err.message);
  }
}

testEndpoints();
