// src/main.tsx
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext';
import { UnitProvider } from './context/UnitContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {}
    {}
    <UnitProvider>
      <App />
    </UnitProvider>
  </StrictMode>
);