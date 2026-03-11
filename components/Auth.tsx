import React, { useEffect, useState } from 'react';
import { loginUser } from '../services/mockBackend';
import { User } from '../types';
import { BrainCircuit } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

declare global {
  interface Window {
    google: any;
  }
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Google Identity Services
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    if (window.google && clientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
        });

        window.google.accounts.id.renderButton(
          document.getElementById("googleSignInDiv"),
          { theme: "outline", size: "large", width: "100%" }
        );
      } catch (e) {
        console.error("Error initializing Google Sign In", e);
        setError("Could not initialize Google Sign In. Please check your configuration.");
      }
    }
  }, []);

  const handleCredentialResponse = (response: any) => {
    try {
      // Decode the JWT token (basic decode, no signature verification in this client-only demo)
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      
      // Log in with extracted data
      const user = loginUser(payload.name, payload.email, payload.picture);
      onLogin(user);
    } catch (e) {
      console.error("Error parsing credential", e);
      setError("Failed to sign in.");
    }
  };

  // Fallback dev login if no client ID is provided or script fails
  const handleDevLogin = () => {
    const user = loginUser("Dev User", "dev@example.com", "https://ui-avatars.com/api/?name=Dev+User&background=random");
    onLogin(user);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
        <div className="text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md mb-4">
            <BrainCircuit className="w-10 h-10" />
          </div>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Welcome to Product Guru</h2>
          <p className="mt-2 text-sm text-slate-600">
            Master your Product Management interviews with AI feedback.
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
           <div id="googleSignInDiv" className="flex justify-center min-h-[40px]"></div>
           
           {error && (
             <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md text-center">
               {error}
             </div>
           )}

           {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <div className="text-center pt-4 border-t border-slate-100 mt-4">
                 <p className="text-xs text-slate-400 mb-2">Dev Mode (No Client ID)</p>
                 <button 
                   onClick={handleDevLogin}
                   className="text-sm text-indigo-600 hover:underline"
                 >
                   Continue as Developer
                 </button>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
