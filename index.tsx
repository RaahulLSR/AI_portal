
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Nexus Error: Could not find root element to mount the application.");
  throw new Error("Could not find root element to mount to");
}

console.log("Nexus Hub: Initializing Application...");
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
