
// import React from "react";
// import ReactDOM from "react-dom/client";
// import App from "./App";
// import { AuthProvider } from "./contexts/AuthContext";

// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//     <AuthProvider>
//       <App />
//     </AuthProvider>
//   </React.StrictMode>
// );

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { GoogleOAuthProvider } from '@react-oauth/google';

// Replace this string with your actual Client ID from Google Cloud Console
const GOOGLE_CLIENT_ID = "1047341456730-slq761dhs1d212u0jfli9ujoheojccn3.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    
      <AuthProvider>
       <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
        </GoogleOAuthProvider> 
      </AuthProvider>
    
  </React.StrictMode>
);
