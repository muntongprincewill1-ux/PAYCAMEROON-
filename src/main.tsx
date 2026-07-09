
window.addEventListener("error", (e) => {
  document.body.innerHTML += "<div style='color:red;padding:20px;background:white;position:fixed;top:0;left:0;z-index:9999;'><pre>" + (e.error?.stack || e.message) + "</pre></div>";
});
window.addEventListener("unhandledrejection", (e) => {
  document.body.innerHTML += "<div style='color:red;padding:20px;background:white;position:fixed;top:0;left:0;z-index:9999;'><pre>" + (e.reason?.stack || e.reason) + "</pre></div>";
});
import "./hugeicons-override.d.ts";
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { ThemeProvider } from './providers/ThemeProvider';

const originalFetch = window.fetch;
Object.defineProperty(window, 'fetch', {
  value: async (...args: Parameters<typeof originalFetch>) => {
    try {
      const response = await originalFetch(...args);
      const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Request ? args[0].url : "");
      if (url.includes("/api/")) {
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const cloned = response.clone();
            const text = await cloned.text();
            return new Response(JSON.stringify({ error: text || "Service error. Please try again." }), {
              status: response.status === 200 ? 500 : (response.status || 500),
              statusText: response.statusText || "Internal Server Error",
              headers: { 'Content-Type': 'application/json' }
            });
          }
      }
      return response;
    } catch (error) {
      console.error("Fetch intercepted error:", error);
      // If "Failed to fetch"
      return new Response(JSON.stringify({ error: "Failed to connect to the server." }), {
        status: 503,
        statusText: "Service Unavailable",
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },
  writable: true,
  configurable: true
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
