const fs = require('fs');
let content = fs.readFileSync('src/pages/MerchantDashboard.tsx', 'utf8');

content = content.replace(`    if (parsedUser && !parsedUser.kycVerified) {
        navigate('/kyc');
        return;
    }`, '');

fs.writeFileSync('src/pages/MerchantDashboard.tsx', content);
