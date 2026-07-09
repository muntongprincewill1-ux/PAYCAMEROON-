const transactionsList = [
  { createdAt: '2026-07-03T04:04:34-07:00' },
  { createdAt: '2026-07-02T12:04:34-07:00' }
];
const heatmapData = [];
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hours = Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`);

const heatmapMap = new Map();
for (let d of days) {
  for (let h of hours) {
    heatmapMap.set(`${d}-${h}`, 0);
  }
}

for (const tx of transactionsList) {
    const txDate = new Date(tx.createdAt);
    const dayString = txDate.toLocaleDateString('en-US', { weekday: 'short' }); 
    const hourString = `${txDate.getHours().toString().padStart(2, '0')}:00`;
    const key = `${dayString}-${hourString}`;
    if (heatmapMap.has(key)) {
        heatmapMap.set(key, heatmapMap.get(key) + 1);
    }
}

for (let d of days) {
  for (let h of hours) {
    heatmapData.push({
       day: d,
       hour: h,
       value: heatmapMap.get(`${d}-${h}`)
    });
  }
}
console.log(heatmapData.filter(d => d.value > 0));
