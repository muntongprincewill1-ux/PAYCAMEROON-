const fs = require('fs');
let content = fs.readFileSync('src/main.tsx', 'utf-8');
if (!content.includes('window.addEventListener("error"')) {
    const errorHandling = `
window.addEventListener("error", (e) => {
  document.body.innerHTML = "<div style='color:red;padding:20px;background:white;'><pre>" + e.error?.stack + "</pre></div>";
});
window.addEventListener("unhandledrejection", (e) => {
  document.body.innerHTML = "<div style='color:red;padding:20px;background:white;'><pre>" + e.reason?.stack + "</pre></div>";
});
`;
    content = errorHandling + content;
    fs.writeFileSync('src/main.tsx', content);
}
