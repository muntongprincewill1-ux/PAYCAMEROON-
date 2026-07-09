const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');
content = content.replace('import mongoose from "mongoose";', 'import mongoose from "mongoose";\nmongoose.set("bufferCommands", false);');
fs.writeFileSync('server.ts', content);
