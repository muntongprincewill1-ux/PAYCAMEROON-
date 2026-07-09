const fs = require('fs');
let content = fs.readFileSync('src/pages/Withdraw.tsx', 'utf8');

content = content.replace("  };\n  };\n  return (", "  };\n  return (");
fs.writeFileSync('src/pages/Withdraw.tsx', content);
