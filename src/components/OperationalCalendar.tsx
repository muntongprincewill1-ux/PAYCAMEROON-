import React, { useRef } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

export default function OperationalCalendar({ data }: { data: { day: string, hour: string, value: number, date?: string }[] }) {
  // Parse stats to find most and least active times
  const activeData = data.filter(d => d.value > 0);
  let max = { value: -1, day: '-', hour: '-', date: '-' } as any;
  let min = { value: Infinity, day: '-', hour: '-', date: '-' } as any;

  if (activeData.length > 0) {
      activeData.forEach(d => {
          if (d.value > max.value) max = d;
          if (d.value < min.value) min = d;
      });
  } else {
      min.value = 0;
      max.value = 0;
  }

  const handleDownload = () => {
    try {
      toast.success('Generating Operational Calendar PDF...');
      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("PayCam Platform", 14, 20);
      
      doc.setFontSize(14);
      doc.setTextColor(71, 85, 105); // slate-500
      doc.text("Operational Calendar Report", 14, 28);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Date Generated: ${new Date().toLocaleString()}`, 14, 35);
      
      // Extremes Summary
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("Activity Extremes", 14, 45);
      
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text(`Peak Activity: ${max.value} transactions (${max.date ? `${max.date} - ` : ''}${max.day} at ${max.hour})`, 14, 52);
      doc.text(`Lowest Activity: ${min.value === Infinity ? 0 : min.value} transactions (${min.date ? `${min.date} - ` : ''}${min.day} at ${min.hour})`, 14, 58);

      // Table Data
      const tableData = activeData.sort((a,b) => b.value - a.value).map((d) => [
          d.date || '-',
          d.day,
          d.hour,
          d.value.toString()
      ]);

      autoTable(doc, {
          startY: 65,
          head: [['Date', 'Day', 'Time', 'Transactions']],
          body: tableData,
          styles: { fontSize: 9, cellPadding: 3, textColor: [51, 65, 85] },
          headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { top: 65 }
      });
      
      const finalY = (doc as any).lastAutoTable.finalY || 65;
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('Prepared By (System Administrator)', 14, finalY + 20);
      doc.line(14, finalY + 25, 80, finalY + 25);
      
      doc.save('operational_calendar.pdf');
      toast.success('PDF downloaded successfully.');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex justify-between items-center mb-4">
        <div>
           <h3 className="text-sm font-bold text-gray-900">Activity Extremes</h3>
           <p className="text-xs text-gray-500">Highest and lowest volume times</p>
        </div>
        <button onClick={handleDownload} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-xs font-bold border border-blue-100 hover:bg-blue-100 transition">
          Download as PDF
        </button>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 text-center hidden">Operational Calendar Report</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100 flex items-start gap-4">
               <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                 ↑
               </div>
               <div>
                  <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Peak Activity</div>
                  <div className="text-2xl font-black text-gray-900">{max.value} <span className="text-sm font-medium text-gray-500">txns</span></div>
                  <div className="text-sm text-gray-600 mt-1 font-medium">{max.date ? `${max.date} - ` : ''}{max.day} at {max.hour}</div>
               </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100 flex items-start gap-4">
               <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">
                 ↓
               </div>
               <div>
                  <div className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Lowest Activity</div>
                  <div className="text-2xl font-black text-gray-900">{min.value === Infinity ? 0 : min.value} <span className="text-sm font-medium text-gray-500">txns</span></div>
                  <div className="text-sm text-gray-600 mt-1 font-medium">{min.date ? `${min.date} - ` : ''}{min.day} at {min.hour}</div>
               </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
             <h4 className="text-sm font-bold text-gray-900 mb-4">Detailed Hourly Breakdown (Active Times)</h4>
             <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 text-gray-600">
                       <tr>
                          <th className="p-2 font-bold uppercase tracking-wider">Date</th>
                          <th className="p-2 font-bold uppercase tracking-wider">Day</th>
                          <th className="p-2 font-bold uppercase tracking-wider">Time</th>
                          <th className="p-2 font-bold uppercase tracking-wider text-right">Transactions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {activeData.sort((a,b) => b.value - a.value).map((d, i) => (
                           <tr key={i} className="hover:bg-gray-50">
                              <td className="p-2 text-gray-600">{d.date || '-'}</td>
                              <td className="p-2 font-medium text-gray-900">{d.day}</td>
                              <td className="p-2 text-gray-600">{d.hour}</td>
                              <td className="p-2 text-right font-mono font-bold text-gray-900">{d.value}</td>
                           </tr>
                       ))}
                       {activeData.length === 0 && (
                           <tr>
                              <td colSpan={4} className="p-4 text-center text-gray-500">No activity recorded.</td>
                           </tr>
                       )}
                    </tbody>
                </table>
             </div>
          </div>
      </div>
    </div>
  );
}
