const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

content = content.replace(
  `      let logsToPrint = auditLogs;
      let filename = 'paycam_audit_logs.pdf';

      autoTable(doc, {
          startY: 45,
          head: [['Date', 'Action', 'Target', 'Details', 'Officer ID']],
          body: logsToPrint.map((log: any) => [
              new Date(log.createdAt || log.timestamp || log.date || new Date()).toLocaleString(),
              log.action || log.desc || '-',
              log.targetId || '-',
              log.details || '-',
              log.officerId || 'System'
          ]),`,
  `      let logsToPrint = ledgerTransactions;
      let filename = 'paycam_financial_audit.pdf';

      autoTable(doc, {
          startY: 45,
          head: [['Date', 'Type', 'Amount (XAF)', 'Fee', 'Recipient / Details']],
          body: logsToPrint.map((log: any) => [
              new Date(log.createdAt || log.date).toLocaleString(),
              log.type || '-',
              (log.amount || 0).toLocaleString(),
              (log.fee || 0).toLocaleString(),
              log.recipient || log.desc || '-'
          ]),`
);

content = content.replace(`doc.text("Official Audit Log Report", 14, 28);`, `doc.text("Official Financial Audit & Ledger", 14, 28);`);

fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
