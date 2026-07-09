const fs = require('fs');
let content = fs.readFileSync('src/pages/Store.tsx', 'utf8');

content = content.replace(
  `  const handleEsimAction = async () => {\n    if (provider.toLowerCase() === 'mtn' && !isMTNNumber(phoneNumber)) {\n      setErrorMsg('Please enter a valid MTN Cameroon number');\n      return;\n    }\n    if (provider.toLowerCase() === 'orange' && !isOrangeNumber(phoneNumber)) {\n      setErrorMsg('Please enter a valid Orange Cameroon number');\n      return;\n    }`,
  `  const handleEsimAction = async () => {\n    if (action === 'swap') {\n      if (provider.toLowerCase() === 'mtn' && !isMTNNumber(phoneNumber)) {\n        setErrorMsg('Please enter a valid MTN Cameroon number');\n        return;\n      }\n      if (provider.toLowerCase() === 'orange' && !isOrangeNumber(phoneNumber)) {\n        setErrorMsg('Please enter a valid Orange Cameroon number');\n        return;\n      }\n    }`
);

fs.writeFileSync('src/pages/Store.tsx', content);
