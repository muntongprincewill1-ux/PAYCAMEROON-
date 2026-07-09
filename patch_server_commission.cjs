const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Update Settings Schema
code = code.replace(
  /appLogoUrl: { type: String, default: "" },/g,
  'appLogoUrl: { type: String, default: "" },\n  merchantCommissionRate: { type: Number, default: 0 },\n  agentCommissionRate: { type: Number, default: 0 },'
);

// Update systemSettings object
code = code.replace(
  /appLogoUrl: ""\n};/g,
  'appLogoUrl: "",\n    merchantCommissionRate: 0,\n    agentCommissionRate: 0\n};'
);

// Update app.post("/api/admin/settings"
code = code.replace(
  /withdrawalFeePercent: parseFloat\(req.body.settings.withdrawalFeePercent\?.toString\(\).replace\('%', ''\) \?\? systemSettings.withdrawalFeePercent\) \|\| 0\n        };/g,
  "withdrawalFeePercent: parseFloat(req.body.settings.withdrawalFeePercent?.toString().replace('%', '') ?? systemSettings.withdrawalFeePercent) || 0,\n            merchantCommissionRate: parseFloat(req.body.settings.merchantCommissionRate?.toString().replace('%', '') ?? systemSettings.merchantCommissionRate) || 0,\n            agentCommissionRate: parseFloat(req.body.settings.agentCommissionRate?.toString().replace('%', '') ?? systemSettings.agentCommissionRate) || 0\n        };"
);

// Update getAgentCommission function
const getAgentTarget = `function getAgentCommission(amount: number, type: 'cash_in' | 'cash_out') {
  if (type === 'cash_in') {
    if (amount <= 50000) return 100;
    if (amount <= 100000) return 250;
    if (amount <= 200000) return 350;
    if (amount <= 300000) return 450;
    if (amount <= 400000) return 550;
    if (amount <= 500000) return 650;
    return Math.floor(amount * 0.0015);
  } else if (type === 'cash_out') {
    if (amount <= 5000) return 50;
    if (amount <= 10000) return 100;
    if (amount <= 50000) return 200;
    if (amount <= 100000) return 400;
    if (amount <= 200000) return 700;
    if (amount <= 300000) return 1000;
    if (amount <= 400000) return 1300;
    if (amount <= 500000) return 1600;
    return Math.floor(amount * 0.0035);
  }
  return 0;
}`;

const getAgentReplacement = `function getAgentCommission(amount: number, type: 'cash_in' | 'cash_out', role?: string) {
  if (role === 'merchant') {
    return Math.floor(amount * ((systemSettings.merchantCommissionRate || 0) / 100));
  } else if (role === 'agent') {
    return Math.floor(amount * ((systemSettings.agentCommissionRate || 0) / 100));
  }
  
  // Fallback if role is not provided
  return Math.floor(amount * ((systemSettings.agentCommissionRate || 0) / 100));
}`;

code = code.replace(getAgentTarget, getAgentReplacement);

// Fix invocations of getAgentCommission
// 1. Agent deposit
code = code.replace(
  /const commission = getAgentCommission\(numAmount, 'cash_in'\);/g,
  "const commission = getAgentCommission(numAmount, 'cash_in', agent ? agent.role : 'agent');"
);

// 2. Merchant pending withdrawal creation (cash_out)
code = code.replace(
  /const commission = getAgentCommission\(numAmount, 'cash_out'\);/g,
  "const commission = getAgentCommission(numAmount, 'cash_out', merchant ? merchant.role : 'merchant');"
);

// 3. User withdrawal processed (cash_out)
code = code.replace(
  /const commission = getAgentCommission\(t\.amount, 'cash_out'\);/g,
  "const commission = getAgentCommission(t.amount, 'cash_out', merchant ? merchant.role : 'merchant');"
);

fs.writeFileSync('server.ts', code);
