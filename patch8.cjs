const fs = require('fs');
let lines = fs.readFileSync('src/pages/Withdraw.tsx', 'utf8').split('\n');

// Ensure we are deleting the right line
if (lines[204].trim() === '};') {
  lines.splice(204, 1);
} else {
  console.log("Line 205 is not '};'. It is: " + lines[204]);
}

fs.writeFileSync('src/pages/Withdraw.tsx', lines.join('\n'));
