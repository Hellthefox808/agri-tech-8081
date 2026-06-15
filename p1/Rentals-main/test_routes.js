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
  console.log("=== Testing Rentals-main API Endpoints ===");
  try {
    const res = await getUrl('http://127.0.0.1:8080/listings');
    console.log(`GET /listings: status = ${res.statusCode}`);
    if (res.statusCode === 200) {
      console.log("🟢 GET /listings SUCCESSFUL!");
    } else {
      console.error(`🔴 GET /listings failed: ${res.statusCode}`);
    }
  } catch (err) {
    console.error("🔴 GET /listings connection error:", err.message);
  }
}

testEndpoints();
