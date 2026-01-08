import React from 'react';
import ReactDOM from 'react-dom/client';
import { Store } from 'statux';
import Router from 'crossroad';
import { App } from './App';
import { initialState } from './store';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Store {...initialState}>
      <Router>
        <App />
      </Router>
    </Store>
  </React.StrictMode>
);
