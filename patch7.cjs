const fs = require('fs');
let lines = fs.readFileSync('src/pages/Withdraw.tsx', 'utf8').split('\n');

for(let i=0; i<lines.length; i++) {
  if (lines[i].includes('  };') && lines[i+1] && lines[i+1].includes('  };') && lines[i+2] && lines[i+2].includes('  return (')) {
     lines.splice(i+1, 1);
     break;
  }
}
fs.writeFileSync('src/pages/Withdraw.tsx', lines.join('\n'));
