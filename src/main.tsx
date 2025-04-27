import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { RefreshProvider } from './hooks/useRefresh';
import { HashRouter } from "react-router-dom";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RefreshProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </RefreshProvider>
  </StrictMode>
);