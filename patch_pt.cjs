const fs = require('fs');
let content = fs.readFileSync('src/pages/PendingTransactions.tsx', 'utf8');

const rejectFunc = `  const handleReject = async (transactionId: string) => {\n    if (!window.confirm("Are you sure you want to reject this withdrawal request?")) return;\n    try {\n      const res = await fetch('/api/user/reject-withdrawal', {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify({ userId: user._id, transactionId })\n      });\n      if (res.ok) {\n        setTransactions(prev => prev.filter(t => t._id !== transactionId));\n      } else {\n        const data = await res.json();\n        setErrorMsg(data.error || 'Failed to reject transaction');\n      }\n    } catch (err) {\n      setErrorMsg('Network error');\n    }\n  };`;

content = content.replace(
  `  const initApprove = (transactionId: string) => {`,
  rejectFunc + `\n\n  const initApprove = (transactionId: string) => {`
);

content = content.replace(
  `                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">`,
  `                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">`
);

content = content.replace(
  `                  <button \n                    onClick={() => initApprove(t._id)}\n                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-colors shadow-sm"\n                  >\n                    <Check size={18} /> Confirm Cash Received\n                  </button>`,
  `                  <button \n                    onClick={() => handleReject(t._id)}\n                    className="bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-colors shadow-sm"\n                  >\n                    Reject\n                  </button>\n                  <button \n                    onClick={() => initApprove(t._id)}\n                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-colors shadow-sm"\n                  >\n                    <Check size={18} /> Confirm Cash Received\n                  </button>`
);

fs.writeFileSync('src/pages/PendingTransactions.tsx', content);
