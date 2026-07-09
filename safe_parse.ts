import fs from 'fs';
import path from 'path';

function walk(dir: string, callback: (file: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk('src', (file) => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    let content = fs.readFileSync(file, 'utf-8');
    if (content.includes("JSON.parse(localStorage.getItem('user')") || content.includes('JSON.parse(localStorage.getItem("user")')) {
      // We will replace it with a safe helper
      // Wait, it's easier to just do a regex replace
      content = content.replace(/JSON\.parse\(localStorage\.getItem\(['"]user['"]\)\s*\|\|\s*['"]{}['"]\)/g, "(() => { try { const u = localStorage.getItem('user'); return u && u !== 'undefined' ? JSON.parse(u) : {}; } catch(e) { return {}; } })()");
      fs.writeFileSync(file, content);
      console.log('Patched', file);
    }
  }
});
