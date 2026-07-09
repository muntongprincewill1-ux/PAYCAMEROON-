const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/InternalWallet\.findOne/g, "mongoose.models.InternalWallet.findOne");
code = code.replace(/InternalWallet\.find/g, "mongoose.models.InternalWallet.find");

fs.writeFileSync('server.ts', code);
console.log("Patched stats scope");
