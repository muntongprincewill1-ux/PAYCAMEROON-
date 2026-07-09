const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
if (code.includes('__dirname')) {
    console.log("__dirname exists");
}
