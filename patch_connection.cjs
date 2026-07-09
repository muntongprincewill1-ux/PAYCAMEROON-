const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Remove the top-level connection logic
const connectionLogic = `let useMockDb = !MONGODB_URI;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 })
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => {
      console.error("MongoDB connection error. Falling back to in-memory mock database.", err.message);
      useMockDb = true;
    });
} else {
  console.log("No MONGODB_URI provided. Using in-memory mock database.");
}`;

content = content.replace(connectionLogic, `let useMockDb = true; // Set to true initially, will switch to false if MongoDB connects successfully`);

// Find the interval
const intervalStart = `setInterval(async () => {`;
content = content.replace(intervalStart, `let aiInterval = setInterval(async () => {`);

// Add the connection logic into startServer
const startServerTarget = `// Vite middleware for development
async function startServer() {`;

const newStartServer = `// Vite middleware for development
async function startServer() {
  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
      console.log("Connected to MongoDB");
      useMockDb = false;
    } catch (err) {
      console.error("MongoDB connection error. Falling back to in-memory mock database.", err.message);
      useMockDb = true;
    }
  } else {
    console.log("No MONGODB_URI provided. Using in-memory mock database.");
  }`;

content = content.replace(startServerTarget, newStartServer);

fs.writeFileSync('server.ts', content);
