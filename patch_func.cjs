const fs = require('fs');
let code = fs.readFileSync('src/pages/AgentDashboard.tsx', 'utf8');

const funcCode = `
  const handleWithdrawCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      let dest = '';
      if (withdrawMethod !== 'paycam_balance') {
         dest = paycamId; // Reusing paycamId state for phone number input
         if (!dest) { setError("Please enter mobile money number"); return; }
      }
      const res = await fetch('/api/agent/withdraw-commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: user._id,
          amount: Number(amount),
          method: withdrawMethod,
          destination: dest
        })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSuccessMsg(\`Commission successfully withdrawn via \${withdrawMethod === 'paycam_balance' ? 'PayCam Balance' : withdrawMethod.toUpperCase()}.\`);
        setUser({ ...user, balance: data.newBalance, commissionBalance: data.newCommissionBalance });
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...userData, balance: data.newBalance, commissionBalance: data.newCommissionBalance }));
        setAmount('');
        setPaycamId(''); // Clear phone number input
      }
    } catch (err) {
      setError('Failed to withdraw commission');
    }
  };
`;

code = code.replace(
  /const fetchStats = async \(id: string\) => \{/,
  funcCode + '\n  const fetchStats = async (id: string) => {'
);

fs.writeFileSync('src/pages/AgentDashboard.tsx', code);
console.log("Patched function");
