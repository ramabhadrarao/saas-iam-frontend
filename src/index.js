// File: frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@tabler/core/dist/css/tabler.min.css';
import App from './App';
import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);