import React from 'react';
import ReactDOM from 'react-dom/client';
import './utils/pwaInstall';
import App from './App';
import PwaUpdateRefresh from './components/PwaUpdateRefresh';
import InstallPrompt from './components/InstallPrompt';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
    <PwaUpdateRefresh />
    <InstallPrompt />
  </React.StrictMode>
);
