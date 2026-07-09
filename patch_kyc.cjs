const fs = require('fs');
let content = fs.readFileSync('src/pages/Kyc.tsx', 'utf8');

const oldCheck = `    if (user && user.kycVerified) {`;
const newCheck = `    if (user && (user.kycVerified || user.role === 'agent')) {`;

content = content.replace(oldCheck, newCheck);

fs.writeFileSync('src/pages/Kyc.tsx', content);
