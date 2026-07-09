import fs from 'fs';

function updatePadding(file) {
    if(!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf-8');
    
    // Replace p-4, p-5, p-6 with p-8 for bg-white cards
    content = content.replace(/className="([^"]*)bg-white([^"]*)p-4([^"]*)"/g, 'className="$1bg-white$2p-8$3"');
    content = content.replace(/className="([^"]*)bg-white([^"]*)p-5([^"]*)"/g, 'className="$1bg-white$2p-8$3"');
    content = content.replace(/className="([^"]*)bg-white([^"]*)p-6([^"]*)"/g, 'className="$1bg-white$2p-8$3"');
    
    // Replace gradient cards p-6 with p-8
    content = content.replace(/className="([^"]*)bg-gradient-to-br([^"]*)p-6([^"]*)"/g, 'className="$1bg-gradient-to-br$2p-8$3"');
    
    // Remove text-center and items-center from cards if they shouldn't be centered (to make text flush)
    // Actually, maybe it's just the centering that makes it not flush left.
    // Let's replace "items-center text-center" with "" in these cards
    content = content.replace(/items-center text-center/g, 'items-start text-left');
    
    fs.writeFileSync(file, content);
}

const files = [
    'src/pages/AdminDashboard.tsx',
    'src/pages/AgentDashboard.tsx',
    'src/pages/MerchantDashboard.tsx',
    'src/pages/FinanceDashboard.tsx',
    'src/pages/ComplianceDashboard.tsx',
    'src/pages/SupportDashboard.tsx'
];

files.forEach(updatePadding);
