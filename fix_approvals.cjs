const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /approvalsList = \[\]; \/\/ mockApprovals not defined\s*\} else \{\s*approvalsList = await Approval\.find\(\{ status: 'pending' \}\);/g,
  `approvalsList = pendingAdminApprovals.filter(a => a.status === 'pending');
        } else {
            approvalsList = await AdminApproval.find({ status: 'pending' });`
);

fs.writeFileSync('server.ts', code);
console.log("Fixed approvals endpoint");
