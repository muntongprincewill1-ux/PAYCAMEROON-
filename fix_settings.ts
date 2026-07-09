import fs from 'fs';
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

// find `const [user, setUser] = useState<any>(null);`
// and remove it
content = content.replace(/const \[user, setUser\] = useState<any>\(null\);\n?/g, '');

// insert it at the very top of Settings component
const target = 'const { t, i18n } = useTranslation();';
content = content.replace(target, target + '\n  const [user, setUser] = useState<any>(null);');

fs.writeFileSync('src/pages/Settings.tsx', content);
console.log('Fixed Settings.tsx');
