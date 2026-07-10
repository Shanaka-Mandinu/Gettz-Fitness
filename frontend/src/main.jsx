import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {AuthProvider} from "@asgardeo/auth-react";

const asgardeoConfig = {
  signInRedirectURL: import.meta.env.VITE_ASGARDEO_SIGNIN_REDIRECT || 'http://localhost:5173',
  signOutRedirectURL: import.meta.env.VITE_ASGARDEO_SIGNOUT_REDIRECT || 'http://localhost:5173',
  clientID: import.meta.env.VITE_ASGARDEO_CLIENT_ID,
  baseUrl: import.meta.env.VITE_ASGARDEO_BASE_URL,
  scope: (import.meta.env.VITE_ASGARDEO_SCOPE || 'openid profile').split(' '),
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider config={asgardeoConfig}>
      <App />
    </AuthProvider>
  </StrictMode>,
)
