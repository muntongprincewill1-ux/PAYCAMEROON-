const fs = require('fs');
let content = fs.readFileSync('src/pages/Store.tsx', 'utf8');

// Add import
content = content.replace(
  `import { useTranslation } from 'react-i18next';`,
  `import { useTranslation } from 'react-i18next';\nimport { QRCodeSVG } from 'qrcode.react';`
);

// Replace simulated QR
const simulatedQRBlock = `              <div className="w-48 h-48 bg-gray-100 dark:bg-gray-700 rounded-2xl border-4 border-dashed border-gray-300 dark:border-gray-500 flex items-center justify-center mb-6 relative">\n                <QrCode size={120} className="text-gray-400 dark:text-gray-500 opacity-50" />\n                <span className="absolute text-xs font-bold bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm text-dark dark:text-white">Simulated QR</span>\n              </div>`;

const realQRBlock = `              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-6">\n                 <QRCodeSVG value={qrCode} size={200} level="H" />\n              </div>`;

content = content.replace(simulatedQRBlock, realQRBlock);

fs.writeFileSync('src/pages/Store.tsx', content);
