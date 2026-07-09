const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldDbSetup = `// --- Database Setup ---
let MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI && MONGODB_URI.includes('/?')) {
  MONGODB_URI = MONGODB_URI.replace('/?', '/paycam?');
}
console.log("MONGODB_URI:", MONGODB_URI);
let useMockDb = true; // Set to true initially, will switch to false if MongoDB connects successfully`;

const newDbSetup = `// --- Database Setup ---
const MONGODB_URI = process.env.MONGODB_URI;
console.log("MONGODB_URI setup:", MONGODB_URI ? "Provided" : "Not Provided");
let useMockDb = true; // Set to true initially, will switch to false if MongoDB connects successfully`;

content = content.replace(oldDbSetup, newDbSetup);

const oldConnect = `  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });`;

const newConnect = `  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI, { 
        serverSelectionTimeoutMS: 10000, // Increased timeout for SRV
        dbName: 'paycam'
      });`;

content = content.replace(oldConnect, newConnect);

fs.writeFileSync('server.ts', content);
