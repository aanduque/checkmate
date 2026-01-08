import React from 'react';
import ReactDOM from 'react-dom/client';
import Router from 'crossroad';
import Store from 'statux';
import { App } from './App';
import { initialState } from './store';
import './index.css';

// Initialize Ionicons custom elements for React
import { defineCustomElements } from 'ionicons/loader';
defineCustomElements(window);

// Theme initialization (before render to prevent flash)
const initTheme = () => {
  const saved = localStorage.getItem('checkmate_theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
};
initTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Store {...initialState}>
      <Router>
        <App />
      </Router>
    </Store>
  </React.StrictMode>
);
