import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Initialize theme from storage (default to light/white unless explicitly dark)
if (typeof window !== 'undefined') {
  const storedTheme = localStorage.getItem('veyra_theme');
  if (storedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

