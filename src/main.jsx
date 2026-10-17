import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import AuthGate from './components/AuthGate.jsx';
import { AppProvider } from './store.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthGate>
      {(session) => (
        // key: a different account gets a completely fresh app state
        <AppProvider key={session.user.uid} session={session}>
          <App />
        </AppProvider>
      )}
    </AuthGate>
  </React.StrictMode>
);
