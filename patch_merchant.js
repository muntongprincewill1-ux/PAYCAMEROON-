const fs = require('fs');
let content = fs.readFileSync('src/pages/MerchantRegister.tsx', 'utf8');
content = content.replace(
  /if \(\!isValidCameroonNumber\(phone\)\) \{/,
  `if (pin.length !== 5 || !/^\\d{5}$/.test(pin)) {
      setError('PIN must be exactly 5 digits');
      setLoading(false);
      return;
    }
    if (!isValidCameroonNumber(phone)) {`
);
content = content.replace(
  /onChange=\{\(e\) => setPin\(e\.target\.value\)\}/,
  `onChange={(e) => setPin(e.target.value.replace(/\\D/g, ''))}`
);
fs.writeFileSync('src/pages/MerchantRegister.tsx', content);
