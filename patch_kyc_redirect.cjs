const fs = require('fs');
let content = fs.readFileSync('src/pages/Kyc.tsx', 'utf8');

content = content.replace(`    if (user && (user.kycVerified || user.role === 'agent')) {`, `    if (user && (user.kycVerified || ['agent', 'merchant'].includes(user.role))) {`);

fs.writeFileSync('src/pages/Kyc.tsx', content);
