const fs = require('fs');
let code = fs.readFileSync('src/pages/FinanceDashboard.tsx', 'utf8');

code = code.replace(
  /<span className="text-emerald-600 text-\[10px\] font-bold bg-emerald-50 px-2 py-0\.5 rounded-md whitespace-nowrap">Available<\/span>/g,
  `<span className="text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded-md whitespace-nowrap">Cumulative</span>`
);

fs.writeFileSync('src/pages/FinanceDashboard.tsx', code);
console.log("Patched FinanceDashboard");
