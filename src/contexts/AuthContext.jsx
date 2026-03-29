import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";

const AuthContext = createContext();

const normalizeToken = (value) => {
  if (!value || typeof value !== "string") return "";
  return value.replace(/^Bearer\s+/i, "").trim();
};

const normalizeUser = (data = {}) => {
  if (!data || typeof data !== "object") return null;
  const id =
    data.id ??
    data.userId ??
    data.user_id ??
    data.uuid ??
    data.sub ??
    data?.user?.id ??
    null;

  return {
    ...data,
    id: id ?? null,
    email: data.email ?? data?.user?.email ?? "",
    username: data.username ?? data?.user?.username ?? "",
  };
};

const buildFallbackProfile = (userData) => ({
  username: userData?.username || userData?.email?.split("@")[0] || "User",
  bio: "",
  karmaBalance: userData?.karmaBalance ?? userData?.karma_balance ?? 25,
  totalKarmaEarned: userData?.totalKarmaEarned ?? userData?.total_karma_earned ?? 25,
  totalKarmaSpent: userData?.totalKarmaSpent ?? userData?.total_karma_spent ?? 0,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userData) => {
    if (!userData) {
      setProfile(null);
      return null;
    }

    try {
      const response = await api.get("/profile/me");
      setProfile(response.data);
      return response.data;
    } catch (error) {
      const status = error?.response?.status;
      const message =
        (typeof error?.response?.data === "string" ? error.response.data : "") ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "";

      if (status === 400 && /profile not found/i.test(message)) {
        const fallbackProfile = buildFallbackProfile(userData);
        setProfile(fallbackProfile);
        return fallbackProfile;
      }

      console.error("Failed to fetch profile:", error);
      setProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      const token = normalizeToken(localStorage.getItem("token"));
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        try {
          const userData = normalizeUser(JSON.parse(storedUser));
          setUser(userData);
          localStorage.setItem("token", token);
          api.defaults.headers.common.Authorization = `Bearer ${token}`;
          await fetchProfile(userData);
        } catch (error) {
          console.error("Failed to parse user:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          setProfile(null);
        }
      }

      setLoading(false);
    };

    loadSession();
  }, [fetchProfile]);

  const signIn = async (email, password) => {
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const rawToken =
        response.data?.token ||
        response.data?.accessToken ||
        response.data?.jwt ||
        (typeof response.data === "string" ? response.data : "");
      const token = normalizeToken(rawToken);
      const userData = normalizeUser(
        response.data.user || {
          email,
          id: response.data.userId,
          username: response.data.username,
        }
      );

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        setUser(userData);
        await fetchProfile(userData);

        return {
          success: true,
          data: response.data,
        };
      }

      console.error("No token in response");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return {
        success: false,
        error: "No authentication token received",
      };
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return {
          success: false,
          error: "Invalid email or password",
        };
      }
      if (error.response?.status === 404) {
        return {
          success: false,
          error: "Login endpoint not found. Check your API URL.",
        };
      }

      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Login failed. Please try again.",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common.Authorization;
    setUser(null);
    setProfile(null);
  };

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
      console.error("Registration error:", error.response?.data || error.message);
      return {
        success: false,
        error:
          (typeof error?.response?.data === "string" && error.response.data) ||
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Registration failed",
      };
    }
  };

  const signInWithGoogle = async (credential) => {
    try {
      const response = await api.post("/auth/google", { credential });

      const rawToken =
        response.data?.token ||
        response.data?.accessToken ||
        response.data?.jwt ||
        (typeof response.data === "string" ? response.data : "");
      const token = normalizeToken(rawToken);
      const userData = normalizeUser(response.data.user || response.data);

      if (!token) {
        return { success: false, error: "No authentication token received" };
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      setUser(userData);
      await fetchProfile(userData);

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Google auth error:", error.response?.data || error.message);
      return {
        success: false,
        error:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Google authentication failed",
      };
    }
  };

  const requestPasswordReset = async (email) => {
    try {
      await api.post("/auth/forgot-password", { email });
      return { success: true };
    } catch (error) {
      console.error("Password reset error:", error.response?.data || error.message);
      return {
        success: false,
        error:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Unable to send reset email",
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        requestPasswordReset,
        logout,
        signInWithGoogle,
        refreshProfile: () => fetchProfile(user),
      }}
    >
    {children}
  </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
