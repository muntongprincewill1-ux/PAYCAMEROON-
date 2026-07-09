const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/let user = useMockDb \? mockUsers\.get\(userId\) : await User\.findById\(userId\)\.catch\(\(\) => null\);/g,
`let user = useMockDb ? mockUsers.get(userId) : await User.findById(userId).catch(() => null);
    if (!user && userId === 'user1') {
      user = mockUsers.get('user1') || { _id: 'user1', paycamId: 'PC00000000', name: 'Demo User', phone: '000000000', role: 'user', balance: 15000 };
      if (!useMockDb) user.save = async () => {}; // mock save
    }`);

code = code.replace(/const agent = useMockDb \? mockUsers\.get\(agentId\) : await User\.findById\(agentId\)\.catch\(\(\) => null\);/g,
`let agent = useMockDb ? mockUsers.get(agentId) : await User.findById(agentId).catch(() => null);
    if (!agent && agentId === 'agent1') {
      agent = mockUsers.get('agent1') || { _id: 'agent1', paycamId: 'AG11111111', name: 'Demo Agent', phone: '111111111', role: 'agent', balance: 500000, commissionBalance: 0 };
      if (!useMockDb) agent.save = async () => {};
    }`);

fs.writeFileSync('server.ts', code);
