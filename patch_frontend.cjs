const fs = require('fs');
let code = fs.readFileSync('src/pages/FinanceDashboard.tsx', 'utf8');

code = code.replace(
  /<span className="text-emerald-600 text-\[10px\] font-bold bg-emerald-50 px-2 py-0\.5 rounded-md whitespace-nowrap">\+8\.1\%<\/span>/g,
  `{stats?.totalVolume > 0 && <span className="text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded-md whitespace-nowrap">Active</span>}`
);
code = code.replace(
  /<span className="text-slate-400 text-\[10px\] uppercase font-bold tracking-widest ">Growth<\/span>/g,
  ``
);

fs.writeFileSync('src/pages/FinanceDashboard.tsx', code);
console.log("Patched FinanceDashboard");
