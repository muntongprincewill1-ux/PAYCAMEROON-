import fs from 'fs';
let content = fs.readFileSync('src/pages/Login.tsx', 'utf-8');

content = content.replace('<form onSubmit={handleLogin}', '<form onSubmit={isForgotPin ? handleResetPin : handleLogin}');
content = content.replace(
  "{loading ? 'Authenticating...' : 'Login securely'}",
  "{loading ? (isForgotPin ? 'Resetting...' : 'Authenticating...') : (isForgotPin ? 'Reset PIN' : 'Login securely')}"
);

fs.writeFileSync('src/pages/Login.tsx', content);
console.log('Login.tsx patched.');
