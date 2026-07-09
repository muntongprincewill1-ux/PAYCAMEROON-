const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/mongoose\.models\.mongoose\.models\.mongoose\.models\.InternalWallet/g, "mongoose.models.InternalWallet");
code = code.replace(/mongoose\.models\.mongoose\.models\.InternalWallet/g, "mongoose.models.InternalWallet");

fs.writeFileSync('server.ts', code);
console.log("Fixed scope");
