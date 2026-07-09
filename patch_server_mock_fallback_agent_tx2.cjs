const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/if \(useMockDb \|\| user\._id === 'user1' \|\| agent\._id === 'agent1'\) \{/g,
`console.log("Checking mock conditions:", { useMockDb, userId: user._id, agentId: agent._id, isUser1: user._id === 'user1', isAgent1: agent._id === 'agent1', isUser1String: String(user._id) === 'user1', isAgent1String: String(agent._id) === 'agent1' });
    if (useMockDb || String(user._id) === 'user1' || String(agent._id) === 'agent1') {`);

fs.writeFileSync('server.ts', code);
