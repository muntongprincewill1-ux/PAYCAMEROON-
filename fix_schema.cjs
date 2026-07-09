const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  `const agentLogSchema = new mongoose.Schema({`,
  `const agentLogSchema = new mongoose.Schema({\n  type: String,`
);

fs.writeFileSync('server.ts', content);
