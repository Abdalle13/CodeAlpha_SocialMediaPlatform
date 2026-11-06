import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Initialize theme safely (default to light/white unless explicitly dark)
if (typeof window !== 'undefined') {
  try {
    const storedTheme = localStorage.getItem('veyra_theme');
    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch {
    document.documentElement.classList.remove('dark');
  }
}

try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
} catch (err) {
  console.error('[Veyra Startup Error]:', err);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
        <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">Unable to load Veyra</h2>
        <p style="font-size: 13px; color: #888; max-width: 320px; margin-bottom: 16px;">A network or browser loading issue occurred. Please refresh the page.</p>
        <button onclick="window.location.reload()" style="padding: 8px 16px; border-radius: 8px; border: 1px solid #ccc; background: transparent; font-weight: 500; cursor: pointer;">Reload Page</button>
      </div>
    `;
  }
}
