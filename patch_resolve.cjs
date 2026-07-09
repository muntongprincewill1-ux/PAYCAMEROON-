const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const oldAlertsTable = `                           <thead className="bg-gray-50/50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                              <tr>
                                 <th className="px-4 py-3 border-b border-gray-100 rounded-tl-lg">Severity</th>
                                 <th className="px-4 py-3 border-b border-gray-100">Rule Triggered</th>
                                 <th className="px-4 py-3 border-b border-gray-100">Description</th>
                                 <th className="px-4 py-3 border-b border-gray-100 text-right rounded-tr-lg">Timestamp</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-50">
                              {amlAlerts.length > 0 ? amlAlerts.map((a, i) => (
                                 <tr key={i} className="hover:bg-gray-50/30">
                                    <td className="px-4 py-3">
                                       <span className={\`px-2 py-1 rounded bg-white border text-[10px] font-black uppercase tracking-wider \${a.severity === 'High' ? 'text-rose-600 border-rose-200 shadow-[0_2px_10px_rgba(225,29,72,0.1)]' : 'text-orange-600 border-orange-200'}\`}>
                                          {a.severity}
                                       </span>
                                    </td>
                                    <td className="px-4 py-3 font-bold text-gray-800">{a.ruleTriggered}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500 max-w-sm ">{a.description}</td>
                                    <td className="px-4 py-3 text-right text-xs font-mono text-gray-400">{new Date(a.createdAt).toLocaleString()}</td>
                                 </tr>
                              )) : (
                                 <tr><td colSpan={4} className="p-8 text-center text-gray-400 text-xs">No active AML alerts.</td></tr>
                              )}`;

const newAlertsTable = `                           <thead className="bg-gray-50/50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                              <tr>
                                 <th className="px-4 py-3 border-b border-gray-100 rounded-tl-lg">Severity</th>
                                 <th className="px-4 py-3 border-b border-gray-100">Rule Triggered</th>
                                 <th className="px-4 py-3 border-b border-gray-100">Description</th>
                                 <th className="px-4 py-3 border-b border-gray-100 text-right">Timestamp</th>
                                 <th className="px-4 py-3 border-b border-gray-100 text-right rounded-tr-lg">Action</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-50">
                              {amlAlerts.length > 0 ? amlAlerts.map((a, i) => (
                                 <tr key={i} className="hover:bg-gray-50/30">
                                    <td className="px-4 py-3">
                                       <span className={\`px-2 py-1 rounded bg-white border text-[10px] font-black uppercase tracking-wider \${a.severity === 'High' ? 'text-rose-600 border-rose-200 shadow-[0_2px_10px_rgba(225,29,72,0.1)]' : 'text-orange-600 border-orange-200'}\`}>
                                          {a.severity}
                                       </span>
                                    </td>
                                    <td className="px-4 py-3 font-bold text-gray-800">{a.ruleTriggered}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500 max-w-sm ">{a.description}</td>
                                    <td className="px-4 py-3 text-right text-xs font-mono text-gray-400">{new Date(a.createdAt).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right">
                                      {a.status === 'open' ? (
                                        <div className="flex gap-2 justify-end">
                                          <button onClick={() => {
                                            fetch(\`/api/compliance/aml-alerts/\${a._id}/resolve\`, {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ action: 'approve', note: 'Cleared by admin', officerId: user?._id || 'admin' })
                                            }).then(() => fetchAdminData(false));
                                          }} className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition">Clear</button>
                                          <button onClick={() => {
                                            fetch(\`/api/compliance/aml-alerts/\${a._id}/resolve\`, {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ action: 'reject', note: 'Escalated by admin', officerId: user?._id || 'admin' })
                                            }).then(() => fetchAdminData(false));
                                          }} className="px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-lg hover:bg-rose-600 transition">Escalate</button>
                                        </div>
                                      ) : (
                                        <span className="text-xs font-bold text-gray-400 capitalize">{a.status}</span>
                                      )}
                                    </td>
                                 </tr>
                              )) : (
                                 <tr><td colSpan={5} className="p-8 text-center text-gray-400 text-xs">No active AML alerts.</td></tr>
                              )}`;

content = content.replace(oldAlertsTable, newAlertsTable);
fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
