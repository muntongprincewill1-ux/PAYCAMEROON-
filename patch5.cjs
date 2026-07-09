const fs = require('fs');
let content = fs.readFileSync('src/pages/Withdraw.tsx', 'utf8');

content = content.replace("      setLoading(true);\n      // Show PIN approval modal before processing", "      // Show PIN approval modal before processing");
content = content.replace("    }\n  };\n  };\n  return (", "    }\n  };\n  return (");
content = content.replace("    }\n  };\n\n  };\n  return (", "    }\n  };\n  return ("); // catch any whitespace variation

fs.writeFileSync('src/pages/Withdraw.tsx', content);
