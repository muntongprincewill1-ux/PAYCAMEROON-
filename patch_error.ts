import fs from 'fs';
let content = fs.readFileSync('src/main.tsx', 'utf-8');
if (!content.includes('window.addEventListener("error"')) {
    const errorHandling = `
window.addEventListener("error", (e) => {
  document.body.innerHTML += "<div style='color:red;padding:20px;background:white;position:fixed;top:0;left:0;z-index:9999;'><pre>" + (e.error?.stack || e.message) + "</pre></div>";
});
window.addEventListener("unhandledrejection", (e) => {
  document.body.innerHTML += "<div style='color:red;padding:20px;background:white;position:fixed;top:0;left:0;z-index:9999;'><pre>" + (e.reason?.stack || e.reason) + "</pre></div>";
});
`;
    content = errorHandling + content;
    fs.writeFileSync('src/main.tsx', content);
}
