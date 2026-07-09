const fs = require('fs');
let content = fs.readFileSync('src/pages/Login.tsx', 'utf8');

content = content.replace(
  /if \(!data\.user\.kycVerified && \['user', 'merchant', 'agent'\]\.includes\(role\)\) {/,
  "if (!data.user.kycVerified && ['user', 'merchant'].includes(role)) {"
);

fs.writeFileSync('src/pages/Login.tsx', content);
