const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /if \(method === 'mtn' \|\| method === 'orange'\) \{/g,
  `if (method === 'mtn' || method === 'orange' || method === 'mtn_momo' || method === 'orange_money') {`
);

fs.writeFileSync('server.ts', code);
console.log("Patched methods");
