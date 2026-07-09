const fs = require('fs');
let content = fs.readFileSync('src/pages/FinanceDashboard.tsx', 'utf8');

const target = `                <tbody className="divide-y divide-slate-100">
                  {ledger.filter((t: any) => t._id.toLowerCase().includes(searchTerm.toLowerCase())).map((tx: any, idx: number) => (`;

const replacement = `                <tbody className="divide-y divide-slate-100">
                  {(userHistory || ledger).filter((t: any) => t._id.toLowerCase().includes(searchTerm.toLowerCase())).map((tx: any, idx: number) => (`;

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/FinanceDashboard.tsx', content);
console.log("Done");
