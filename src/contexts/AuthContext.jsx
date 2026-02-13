import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext();

const normalizeToken = (value) => {
  if (!value || typeof value !== "string") return "";
  return value.replace(/^Bearer\s+/i, "").trim();
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // CRITICAL: Load user from localStorage on app start
  useEffect(() => {
    const token = normalizeToken(localStorage.getItem("token"));
    const storedUser = localStorage.getItem("user");
    
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        localStorage.setItem("token", token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('Loaded user from localStorage:', userData);
      } catch (error) {
        console.error('Failed to parse user:', error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  // LOGIN - UPDATED
  const signIn = async (email, password) => {
    try {
      console.log('Attempting login for:', email);
      
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      console.log('Login response:', response.data);
      
      // ADJUST THIS BASED ON YOUR BACKEND RESPONSE
      const rawToken =
        response.data?.token ||
        response.data?.accessToken ||
        response.data?.jwt ||
        (typeof response.data === "string" ? response.data : "");
      const token = normalizeToken(rawToken);
      const userData = response.data.user || { 
        email,
        id: response.data.userId,
        username: response.data.username 
      };
      
      if (token) {
        // Store token and user
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        
        // Update axios headers
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // UPDATE STATE - THIS TRIGGERS RE-RENDER
        setUser(userData);
        
        return { 
          success: true, 
          data: response.data 
        };
      } else {
        console.error('No token in response');
        return { 
          success: false, 
          error: "No authentication token received" 
        };
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        return { 
          success: false, 
          error: "Invalid email or password" 
        };
      } else if (error.response?.status === 404) {
        return { 
          success: false, 
          error: "Login endpoint not found. Check your API URL." 
        };
      }
      
      return { 
        success: false, 
        error: error.response?.data?.message || 
               error.response?.data?.error || 
               "Login failed. Please try again." 
      };
    }
  };

  // LOGOUT - UPDATED
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common['Authorization'];
    setUser(null); // THIS TRIGGERS RE-RENDER TO SHOW LOGIN
  };

  // Keep signUp as you had it
  const signUp = async (email, password, username, fullName, location) => {
    try {
      const response = await api.post("/auth/register", {
        email,
        password,
        username,
        fullName,
        location,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || "Registration failed" 
      };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user,
      loading,
      signIn,
      signUp,
      logout  // Changed from signOut to logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
