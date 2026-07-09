import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf-8');

content = content.replace(
  "{ _id: String(mockIdCounter++), userId: agent._id, type: 'agent_cash_in_out', amount: numAmount, agency: 'PayCam', recipient: user.paycamId, fee: 0, status: 'completed', createdAt: new Date() },",
  "{ _id: String(mockIdCounter++), userId: agent._id, type: 'agent_cash_in_out', amount: numAmount, agency: 'PayCam', recipient: user.paycamId, fee: 0, commissionRecord: commission, status: 'completed', createdAt: new Date() },"
);

content = content.replace(
  "{ userId: agent._id, type: 'agent_cash_in_out', amount: numAmount, agency: 'PayCam', recipient: user.paycamId, fee: 0 },",
  "{ userId: agent._id, type: 'agent_cash_in_out', amount: numAmount, agency: 'PayCam', recipient: user.paycamId, fee: 0, commissionRecord: commission },"
);

fs.writeFileSync('server.ts', content);
console.log('Cash-in patched for commissionRecord.');
