const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

content = content.replace(
  /if \(parsedUser && !parsedUser\.kycVerified\) \{/,
  "if (parsedUser && !parsedUser.kycVerified && ['user', 'merchant'].includes(parsedUser.role)) {"
);

fs.writeFileSync('src/pages/Home.tsx', content);
